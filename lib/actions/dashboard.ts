"use server";

import {
  BatchStatus,
  ChatThreadStatus,
  PaymentMethod,
  PaymentStatus,
  PickupSlot,
  PickupStatus,
  Role,
  VerificationState,
  WasteType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { PICKUP_SLOT_LABEL, PRICE_PER_KG, calculatePrice, normalizeWastePricingMap } from "@/lib/constants";
import { db } from "@/lib/db";
import { COLLECTOR_REJECTION_REASONS, parsePickupRejectionHistory } from "@/lib/pickup-alerts";
import {
  cancelPickupAsBusy,
  evaluatePickupMatchingState,
  expireTimedOutPendingPickups,
} from "@/lib/pickup-maintenance";
import { computePickupRouteSnapshot } from "@/lib/routing";
import { createAdminClient } from "@/lib/supabase/admin";

const pickupRequestSchema = z.object({
  wasteType: z.nativeEnum(WasteType),
  estimatedWeightKg: z.coerce.number().positive("Estimasi berat harus lebih dari 0."),
  pickupSlot: z.nativeEnum(PickupSlot),
  addressId: z.string().uuid().optional(),
  addressText: z.string().min(8, "Alamat pickup minimal 8 karakter."),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  notes: z.string().max(240).optional(),
});

const completePickupSchema = z.object({
  actualWeightKg: z.coerce.number().positive("Berat aktual harus lebih dari 0."),
  paymentMethod: z.nativeEnum(PaymentMethod),
  collectorNote: z.string().max(240).optional(),
});

const submitRatingSchema = z.object({
  score: z.coerce.number().min(1, "Minimal 1 bintang").max(5, "Maksimal 5 bintang"),
  comment: z.string().max(240).optional(),
});

const cancelPickupSchema = z.object({
  cancellationReason: z.string().min(5, "Alasan pembatalan minimal 5 karakter.").max(240),
});

const collectorRejectSchema = z.object({
  rejectionReason: z.enum(COLLECTOR_REJECTION_REASONS),
});

const acceptBatchScheduleSchema = z.object({
  scheduledAt: z.string().min(1, "Tanggal dan jam pickup wajib diisi."),
});

type ActionState = {
  success: boolean;
  message: string;
};

function revalidateMarketplaceViews() {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/collector");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/demo");
  revalidatePath("/pickups");
  revalidatePath("/transactions");
  revalidatePath("/leaderboard");
  revalidatePath("/showcase");
}

function getWasteKey(type: WasteType) {
  return type.toLowerCase() as keyof typeof PRICE_PER_KG;
}

function deriveAreaLabel(address: string) {
  const segments = address
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
  return segments.slice(0, 2).join(", ") || address.trim();
}

function buildScheduledDate(slot: PickupSlot) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const hour = slot === PickupSlot.PAGI ? 8 : slot === PickupSlot.SIANG ? 11 : 14;
  date.setHours(hour, 0, 0, 0);
  return date;
}

function parseScheduledAtInput(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Jadwal pickup belum valid.");
  }

  if (parsed.getTime() < Date.now()) {
    throw new Error("Jadwal pickup tidak boleh di masa lalu.");
  }

  return parsed;
}

function buildRequestNo() {
  const timestamp = Date.now().toString().slice(-8);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SW-${timestamp}-${suffix}`;
}

async function openPickupChatsForBatch(batchId: string, collectorId: string, scheduledAt: Date) {
  const requests = await db.pickupRequest.findMany({
    where: {
      batchId,
      collectorId,
      status: PickupStatus.TERJADWAL,
    },
    select: {
      id: true,
      userId: true,
      requestNo: true,
    },
  });

  for (const request of requests) {
    const thread = await db.chatThread.upsert({
      where: { pickupRequestId: request.id },
      update: {
        userId: request.userId,
        collectorId,
        status: ChatThreadStatus.ACTIVE,
        expiresAt: null,
        collectorLastReadAt: new Date(),
      },
      create: {
        pickupRequestId: request.id,
        userId: request.userId,
        collectorId,
        status: ChatThreadStatus.ACTIVE,
        collectorLastReadAt: new Date(),
      },
    });

    await db.$transaction([
      db.chatMessage.create({
        data: {
          threadId: thread.id,
          senderId: collectorId,
          content: `Pickup ${request.requestNo} telah diterima. Jadwal pickup: ${scheduledAt.toLocaleString("id-ID")}.`,
          isSystemMessage: true,
        },
      }),
      db.chatThread.update({
        where: { id: thread.id },
        data: {
          lastMessageAt: new Date(),
        },
      }),
    ]);
  }
}

async function assignPickupToBatch(pickupRequestId: string) {
  await expireTimedOutPendingPickups();

  const pickup = await db.pickupRequest.findUniqueOrThrow({
    where: { id: pickupRequestId },
  });

  if (pickup.status !== PickupStatus.MENUNGGU_MATCHING || pickup.requiresUserDecision) {
    return;
  }

  const evaluation = await evaluatePickupMatchingState(pickupRequestId);
  if (evaluation.outcome !== "assignable" || !evaluation.candidate) {
    return;
  }

  const candidate = evaluation.candidate;
  const collectorPricing = normalizeWastePricingMap(candidate.wastePricing);
  const collectorPricePerKg = collectorPricing[pickup.wasteType];

  const batch =
    (await db.pickupBatch.findFirst({
      where: {
        collectorId: candidate.id,
        pickupSlot: pickup.pickupSlot,
        serviceAreaLabel: pickup.areaLabel,
        status: BatchStatus.MENUNGGU_KONFIRMASI,
      },
      orderBy: { createdAt: "desc" },
    })) ??
    (await db.pickupBatch.create({
      data: {
        collectorId: candidate.id,
        pickupSlot: pickup.pickupSlot,
        serviceAreaLabel: pickup.areaLabel,
        totalEstimatedWeight: 0,
        totalStops: 0,
      },
    }));

  await db.$transaction([
    db.pickupRequest.update({
      where: { id: pickup.id },
      data: {
        collectorId: candidate.id,
        batchId: batch.id,
        pricePerKgSnapshot: collectorPricePerKg,
        estimatedTotalAmount: Math.round(collectorPricePerKg * pickup.estimatedWeightKg),
      },
    }),
    db.pickupBatch.update({
      where: { id: batch.id },
      data: {
        totalEstimatedWeight: {
          increment: pickup.estimatedWeightKg,
        },
        totalStops: {
          increment: 1,
        },
      },
    }),
  ]);

  const routeSnapshot = await computePickupRouteSnapshot({
    originLatitude: candidate.latitude,
    originLongitude: candidate.longitude,
    destinationLatitude: pickup.latitude,
    destinationLongitude: pickup.longitude,
  });

  if (routeSnapshot) {
    await db.pickupRequest.update({
      where: { id: pickup.id },
      data: {
        routeDistanceMeters: routeSnapshot.distanceMeters,
        routeDurationSeconds: routeSnapshot.durationSeconds,
        routeProvider: routeSnapshot.provider,
        routeCalculatedAt: routeSnapshot.calculatedAt,
      },
    });
  }
}

export async function createPickupRequest(_: ActionState, formData: FormData) {
  const user = await requireRole(Role.USER);
  await expireTimedOutPendingPickups();

  const parsed = pickupRequestSchema.safeParse({
    wasteType: formData.get("wasteType"),
    estimatedWeightKg: formData.get("estimatedWeightKg"),
    pickupSlot: formData.get("pickupSlot"),
    addressId: formData.get("addressId") || undefined,
    addressText: formData.get("addressText"),
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Data pickup belum valid.",
    };
  }

  const file = formData.get("photo");
  const photo = file instanceof File && file.size > 0 ? await uploadWastePhoto(file, user.id) : null;
  const savedAddress = parsed.data.addressId
    ? await db.savedAddress.findFirst({
        where: {
          id: parsed.data.addressId,
          profileId: user.id,
        },
      })
    : null;
  const resolvedAddressText = savedAddress?.address ?? parsed.data.addressText;
  const resolvedLatitude = savedAddress?.latitude ?? parsed.data.latitude;
  const resolvedLongitude = savedAddress?.longitude ?? parsed.data.longitude;
  const areaLabel = deriveAreaLabel(resolvedAddressText);
  const pricePerKgSnapshot = PRICE_PER_KG[getWasteKey(parsed.data.wasteType)];

  const pickup = await db.pickupRequest.create({
    data: {
      requestNo: buildRequestNo(),
      userId: user.id,
      wasteType: parsed.data.wasteType,
      estimatedWeightKg: parsed.data.estimatedWeightKg,
      pricePerKgSnapshot,
      estimatedTotalAmount: calculatePrice(getWasteKey(parsed.data.wasteType), parsed.data.estimatedWeightKg),
      photoUrl: photo?.publicUrl,
      photoPath: photo?.path,
      photoMimeType: photo?.mimeType,
      addressId: savedAddress?.id,
      addressText: resolvedAddressText,
      latitude: resolvedLatitude,
      longitude: resolvedLongitude,
      areaLabel,
      pickupSlot: parsed.data.pickupSlot,
      status: PickupStatus.MENUNGGU_MATCHING,
      notes: parsed.data.notes,
    },
  });

  await assignPickupToBatch(pickup.id);
  revalidateMarketplaceViews();

  return {
    success: true,
    message: `Pickup masuk antrian matching. Estimasi ${parsed.data.estimatedWeightKg.toFixed(1)} kg untuk slot ${PICKUP_SLOT_LABEL[parsed.data.pickupSlot]}.`,
  };
}

export async function acceptPickupBatch(batchId: string) {
  const formData = new FormData();
  formData.set("scheduledAt", buildScheduledDate(PickupSlot.PAGI).toISOString());
  return acceptPickupBatchWithSchedule(batchId, formData);
}

export async function acceptPickupBatchWithSchedule(batchId: string, formData: FormData) {
  const collector = await requireRole(Role.COLLECTOR);
  await expireTimedOutPendingPickups();

  const parsed = acceptBatchScheduleSchema.safeParse({
    scheduledAt: formData.get("scheduledAt"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Jadwal pickup belum valid.");
  }

  const batch = await db.pickupBatch.findUniqueOrThrow({
    where: { id: batchId },
    include: {
      requests: true,
    },
  });

  if (batch.collectorId !== collector.id) {
    throw new Error("Tidak punya akses untuk menerima batch ini.");
  }

  if (collector.verificationState !== VerificationState.VERIFIED) {
    throw new Error("Collector belum diverifikasi admin.");
  }

  const scheduledAt = parseScheduledAtInput(parsed.data.scheduledAt);

  await db.$transaction([
    db.pickupBatch.update({
      where: { id: batch.id },
      data: {
        status: BatchStatus.TERJADWAL,
        scheduledFor: scheduledAt,
      },
    }),
    db.pickupRequest.updateMany({
      where: { batchId: batch.id, status: PickupStatus.MENUNGGU_MATCHING },
      data: {
        status: PickupStatus.TERJADWAL,
        scheduledAt,
        requiresUserDecision: false,
        userAlertType: null,
        userAlertMessage: null,
        userAlertAcknowledgedAt: null,
      },
    }),
    db.profile.update({
      where: { id: collector.id },
      data: {
        currentLoadKg: {
          increment: batch.totalEstimatedWeight,
        },
      },
    }),
  ]);

  await openPickupChatsForBatch(batch.id, collector.id, scheduledAt);

  revalidateMarketplaceViews();
}

export async function rejectPickupBatch(batchId: string) {
  const formData = new FormData();
  formData.set("rejectionReason", COLLECTOR_REJECTION_REASONS[0]);
  return rejectPickupBatchWithReason(batchId, formData);
}

export async function rejectPickupBatchWithReason(batchId: string, formData: FormData) {
  const collector = await requireRole(Role.COLLECTOR);
  await expireTimedOutPendingPickups();

  const parsed = collectorRejectSchema.safeParse({
    rejectionReason: formData.get("rejectionReason"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Pilih alasan penolakan terlebih dulu.");
  }

  const batch = await db.pickupBatch.findUniqueOrThrow({
    where: { id: batchId },
    include: {
      requests: {
        where: { status: PickupStatus.MENUNGGU_MATCHING },
      },
    },
  });

  if (batch.collectorId !== collector.id) {
    throw new Error("Tidak punya akses untuk menolak batch ini.");
  }

  await db.pickupBatch.update({
    where: { id: batch.id },
    data: {
      status: BatchStatus.DITOLAK,
    },
  });

  for (const request of batch.requests) {
    await db.chatThread.updateMany({
      where: { pickupRequestId: request.id },
      data: { status: ChatThreadStatus.CLOSED },
    });

    const rejectionHistory = parsePickupRejectionHistory(request.rejectionHistory);
    rejectionHistory.push({
      collectorId: collector.id,
      collectorName: collector.name,
      reason: parsed.data.rejectionReason,
      rejectedAt: new Date().toISOString(),
    });

    await db.pickupRequest.update({
      where: { id: request.id },
      data: {
        batchId: null,
        collectorId: null,
        rejectedCollectorIds: {
          push: collector.id,
        },
        rejectionHistory,
        requiresUserDecision: false,
        userAlertType: null,
        userAlertMessage: null,
        userAlertAcknowledgedAt: null,
        routeDistanceMeters: null,
        routeDurationSeconds: null,
        routeProvider: null,
        routeCalculatedAt: null,
      },
    });
  }

  for (const request of batch.requests) {
    await assignPickupToBatch(request.id);
  }

  revalidateMarketplaceViews();
}

export async function startPickupBatch(batchId: string) {
  const collector = await requireRole(Role.COLLECTOR);
  await expireTimedOutPendingPickups();

  const batch = await db.pickupBatch.findUniqueOrThrow({
    where: { id: batchId },
  });

  if (batch.collectorId !== collector.id) {
    throw new Error("Tidak punya akses untuk memulai batch ini.");
  }

  await db.$transaction([
    db.pickupBatch.update({
      where: { id: batch.id },
      data: { status: BatchStatus.DALAM_PERJALANAN },
    }),
    db.pickupRequest.updateMany({
      where: { batchId: batch.id, status: PickupStatus.TERJADWAL },
      data: { status: PickupStatus.DALAM_PERJALANAN },
    }),
  ]);

  revalidateMarketplaceViews();
}

export async function completePickupRequest(pickupRequestId: string, formData: FormData) {
  const collector = await requireRole(Role.COLLECTOR);
  await expireTimedOutPendingPickups();

  const parsed = completePickupSchema.safeParse({
    actualWeightKg: formData.get("actualWeightKg"),
    paymentMethod: formData.get("paymentMethod"),
    collectorNote: formData.get("collectorNote") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data penyelesaian pickup belum valid.");
  }

  const pickup = await db.pickupRequest.findUniqueOrThrow({
    where: { id: pickupRequestId },
    include: {
      transaction: true,
      batch: true,
    },
  });

  if (pickup.collectorId !== collector.id) {
    throw new Error("Tidak punya akses untuk menyelesaikan pickup ini.");
  }

  if (pickup.status === PickupStatus.SELESAI) {
    return;
  }

  const finalTotalAmount = Math.round(parsed.data.actualWeightKg * pickup.pricePerKgSnapshot);
  const deltaWeight = Math.abs(parsed.data.actualWeightKg - pickup.estimatedWeightKg);
  const weightFlagged = pickup.estimatedWeightKg > 0 && deltaWeight / pickup.estimatedWeightKg > 0.3;

  await db.$transaction(async (tx) => {
    await tx.pickupRequest.update({
      where: { id: pickup.id },
      data: {
        actualWeightKg: parsed.data.actualWeightKg,
        finalTotalAmount,
        collectorNote: parsed.data.collectorNote,
        paymentMethod: parsed.data.paymentMethod,
        paymentStatus: PaymentStatus.DIBAYAR,
        status: PickupStatus.SELESAI,
        weightFlagged,
        completedAt: new Date(),
      },
    });

    await tx.chatThread.updateMany({
      where: { pickupRequestId: pickup.id },
      data: {
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    if (!pickup.transaction) {
      await tx.transaction.create({
        data: {
          userId: pickup.userId,
          collectorId: collector.id,
          pickupRequestId: pickup.id,
          amount: finalTotalAmount,
          description: `Pickup ${pickup.requestNo} selesai dan dibayar ${parsed.data.paymentMethod.toLowerCase()}`,
        },
      });
    }

    if (pickup.batchId) {
      const remainingActive = await tx.pickupRequest.count({
        where: {
          batchId: pickup.batchId,
          status: {
            notIn: [PickupStatus.SELESAI, PickupStatus.DIBATALKAN],
          },
          id: {
            not: pickup.id,
          },
        },
      });

      await tx.pickupBatch.update({
        where: { id: pickup.batchId },
        data: {
          totalActualWeight: {
            increment: parsed.data.actualWeightKg,
          },
          status: remainingActive === 0 ? BatchStatus.SELESAI : undefined,
        },
      });
    }
  });

  revalidateMarketplaceViews();
}

export async function verifyCollector(collectorId: string) {
  await requireRole(Role.ADMIN);
  await expireTimedOutPendingPickups();

  await db.profile.update({
    where: { id: collectorId },
    data: {
      verificationState: VerificationState.VERIFIED,
    },
  });

  const unmatchedRequests = await db.pickupRequest.findMany({
    where: {
      status: PickupStatus.MENUNGGU_MATCHING,
      collectorId: null,
      requiresUserDecision: false,
    },
    select: { id: true },
    take: 20,
  });

  for (const request of unmatchedRequests) {
    await assignPickupToBatch(request.id);
  }

  revalidateMarketplaceViews();
}

export async function submitRating(pickupRequestId: string, formData: FormData) {
  const profile = await requireRole(Role.USER);
  await expireTimedOutPendingPickups();

  const parsed = submitRatingSchema.safeParse({
    score: formData.get("score"),
    comment: formData.get("comment") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data rating tidak valid.");
  }

  const pickup = await db.pickupRequest.findUniqueOrThrow({
    where: { id: pickupRequestId },
    include: { ratings: true },
  });

  if (pickup.userId !== profile.id) {
    throw new Error("Tidak punya akses untuk memberi rating pada pickup ini.");
  }
  if (pickup.status !== PickupStatus.SELESAI || !pickup.collectorId) {
    throw new Error("Pickup belum selesai atau tidak ada collector yang bisa dinilai.");
  }
  if (pickup.ratings.some((r) => r.fromUserId === profile.id)) {
    throw new Error("Anda sudah memberikan rating untuk pickup ini.");
  }

  await db.rating.create({
    data: {
      pickupRequestId: pickup.id,
      fromUserId: profile.id,
      toUserId: pickup.collectorId,
      score: parsed.data.score,
      comment: parsed.data.comment,
    },
  });

  revalidateMarketplaceViews();
}

export async function cancelPickupRequest(pickupRequestId: string, formData: FormData) {
  const profile = await requireRole(Role.USER);
  await expireTimedOutPendingPickups();

  const parsed = cancelPickupSchema.safeParse({
    cancellationReason: formData.get("cancellationReason"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Alasan pembatalan tidak valid.");
  }

  const pickup = await db.pickupRequest.findUniqueOrThrow({
    where: { id: pickupRequestId },
    include: { batch: true },
  });

  if (pickup.userId !== profile.id) {
    throw new Error("Tidak punya akses membatalkan request ini.");
  }

  if (
    pickup.status === PickupStatus.DALAM_PERJALANAN ||
    pickup.status === PickupStatus.SELESAI ||
    pickup.status === PickupStatus.DIBATALKAN
  ) {
    throw new Error("Pickup ini sudah tidak bisa dibatalkan.");
  }

  await db.$transaction(async (tx) => {
    await tx.pickupRequest.update({
      where: { id: pickup.id },
      data: {
        status: PickupStatus.DIBATALKAN,
        cancellationReason: parsed.data.cancellationReason,
        requiresUserDecision: false,
        userAlertType: null,
        userAlertMessage: null,
      },
    });

    await tx.chatThread.updateMany({
      where: { pickupRequestId: pickup.id },
      data: {
        status: ChatThreadStatus.CLOSED,
      },
    });

    if (pickup.batchId && pickup.collectorId) {
      await tx.pickupBatch.update({
        where: { id: pickup.batchId },
        data: {
          totalEstimatedWeight: {
            decrement: pickup.estimatedWeightKg,
          },
          totalStops: {
            decrement: 1,
          },
        },
      });

      if (pickup.status === PickupStatus.TERJADWAL) {
        await tx.profile.update({
          where: { id: pickup.collectorId },
          data: {
            currentLoadKg: {
              decrement: pickup.estimatedWeightKg,
            },
          },
        });
      }
    }
  });

  revalidateMarketplaceViews();
}

export async function abortPickupBatch(batchId: string, formData: FormData) {
  const collector = await requireRole(Role.COLLECTOR);
  await expireTimedOutPendingPickups();

  const parsed = cancelPickupSchema.safeParse({
    cancellationReason: formData.get("cancellationReason"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Alasan pembatalan rute tidak valid.");
  }

  const batch = await db.pickupBatch.findUniqueOrThrow({
    where: { id: batchId },
    include: { requests: true },
  });

  if (batch.collectorId !== collector.id) {
    throw new Error("Tidak punya akses.");
  }

  if (batch.status === BatchStatus.SELESAI || batch.status === BatchStatus.DITOLAK) {
    throw new Error("Batch ini sudah berstatus selesai atau sudah ditolak.");
  }

  const activeRequests = batch.requests.filter(
    (request) => request.status !== PickupStatus.SELESAI && request.status !== PickupStatus.DIBATALKAN,
  );
  const remainingWeight = activeRequests.reduce((acc, curr) => acc + curr.estimatedWeightKg, 0);

  await db.$transaction(async (tx) => {
    await tx.pickupBatch.update({
      where: { id: batch.id },
      data: {
        status: BatchStatus.DITOLAK,
      },
    });

    if (batch.status === BatchStatus.TERJADWAL || batch.status === BatchStatus.DALAM_PERJALANAN) {
      await tx.profile.update({
        where: { id: collector.id },
        data: {
          currentLoadKg: {
            decrement: remainingWeight,
          },
        },
      });
    }

    for (const request of activeRequests) {
      await tx.chatThread.updateMany({
        where: { pickupRequestId: request.id },
        data: {
          status: ChatThreadStatus.CLOSED,
        },
      });

      const rejectionHistory = parsePickupRejectionHistory(request.rejectionHistory);
      rejectionHistory.push({
        collectorId: collector.id,
        collectorName: collector.name,
        reason: parsed.data.cancellationReason,
        rejectedAt: new Date().toISOString(),
      });

      await tx.pickupRequest.update({
        where: { id: request.id },
        data: {
          batchId: null,
          collectorId: null,
          status: PickupStatus.MENUNGGU_MATCHING,
          rejectedCollectorIds: {
            push: collector.id,
          },
          rejectionHistory,
          routeDistanceMeters: null,
          routeDurationSeconds: null,
          routeProvider: null,
          routeCalculatedAt: null,
          collectorNote: `Re-queued: Collector membatalkan rute karena ${parsed.data.cancellationReason}`,
        },
      });
    }
  });

  for (const request of activeRequests) {
    await assignPickupToBatch(request.id).catch(() => {});
  }

  revalidateMarketplaceViews();
}

export async function continuePickupAfterRejections(pickupRequestId: string) {
  const profile = await requireRole(Role.USER);
  await expireTimedOutPendingPickups();

  const pickup = await db.pickupRequest.findUniqueOrThrow({
    where: { id: pickupRequestId },
  });

  if (pickup.userId !== profile.id) {
    throw new Error("Tidak punya akses.");
  }

  await db.pickupRequest.update({
    where: { id: pickup.id },
    data: {
      requiresUserDecision: false,
      userAlertType: null,
      userAlertMessage: null,
      userAlertAcknowledgedAt: new Date(),
    },
  });

  await db.chatThread.updateMany({
    where: { pickupRequestId: pickup.id },
    data: {
      status: ChatThreadStatus.CLOSED,
    },
  });

  await assignPickupToBatch(pickup.id);
  revalidateMarketplaceViews();
}

export async function cancelPickupAfterRejections(pickupRequestId: string) {
  const profile = await requireRole(Role.USER);
  const pickup = await db.pickupRequest.findUniqueOrThrow({
    where: { id: pickupRequestId },
  });

  if (pickup.userId !== profile.id) {
    throw new Error("Tidak punya akses.");
  }

  await db.pickupRequest.update({
    where: { id: pickup.id },
    data: {
      status: PickupStatus.DIBATALKAN,
      cancellationReason: "Dibatalkan user setelah beberapa collector menolak pickup.",
      requiresUserDecision: false,
      userAlertType: null,
      userAlertMessage: null,
      userAlertAcknowledgedAt: new Date(),
    },
  });

  revalidateMarketplaceViews();
}

export async function dismissPickupAlert(pickupRequestId: string) {
  const profile = await requireRole(Role.USER);
  const pickup = await db.pickupRequest.findUniqueOrThrow({
    where: { id: pickupRequestId },
  });

  if (pickup.userId !== profile.id) {
    throw new Error("Tidak punya akses.");
  }

  await db.pickupRequest.update({
    where: { id: pickup.id },
    data: {
      userAlertAcknowledgedAt: new Date(),
    },
  });

  revalidateMarketplaceViews();
}

async function uploadWastePhoto(file: File, profileId: string) {
  const client = createAdminClient();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "waste-photos";
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${profileId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await client.storage.from(bucket).upload(path, await file.arrayBuffer(), {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) {
    throw new Error(`Gagal upload foto: ${error.message}`);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl,
    mimeType: file.type || "image/jpeg",
  };
}
