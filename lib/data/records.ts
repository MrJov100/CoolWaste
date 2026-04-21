import { PickupStatus, Role } from "@prisma/client";

import { db } from "@/lib/db";
import { expireTimedOutPendingPickups } from "@/lib/pickup-maintenance";
import { parsePickupRejectionHistory } from "@/lib/pickup-alerts";
import type { PickupDetailData, PickupRequestCard, TransactionListEntry } from "@/lib/types";

export async function getTransactionsForProfile(
  profileId: string,
  role: Role,
  filters?: {
    type?: string;
    query?: string;
  },
) {
  const transactions = await db.transaction.findMany({
    where: {
      ...(role === Role.ADMIN
        ? {}
        : role === Role.COLLECTOR
          ? { collectorId: profileId }
          : { userId: profileId }),
      ...(filters?.type ? { type: filters.type as never } : {}),
      ...(filters?.query
        ? {
            OR: [
              { description: { contains: filters.query, mode: "insensitive" } },
              { user: { name: { contains: filters.query, mode: "insensitive" } } },
              { collector: { name: { contains: filters.query, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      user: true,
      collector: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return transactions.map<TransactionListEntry>((item) => ({
    id: item.id,
    amount: item.amount,
    type: item.type,
    description: item.description,
    createdAt: item.createdAt,
    pickupRequestId: item.pickupRequestId,
    userName: item.user.name,
    collectorName: item.collector?.name ?? null,
  }));
}

export async function getTransactionsExportRows(
  profileId: string,
  role: Role,
  filters?: {
    type?: string;
    query?: string;
  },
) {
  const transactions = await getTransactionsForProfile(profileId, role, filters);

  return transactions.map((item) => ({
    id: item.id,
    user: item.userName,
    collector: item.collectorName,
    type: item.type,
    amount: item.amount,
    description: item.description,
    pickup_request_id: item.pickupRequestId,
    created_at: item.createdAt.toISOString(),
  }));
}

export async function getPickupsForProfile(
  profileId: string,
  role: Role,
  filters?: {
    status?: string;
  },
) {
  await expireTimedOutPendingPickups();
  const pickups = await db.pickupRequest.findMany({
    where: {
      ...(role === Role.ADMIN
        ? {}
        : role === Role.COLLECTOR
          ? { collectorId: profileId }
          : { userId: profileId }),
      ...(filters?.status ? { status: filters.status as never } : {}),
    },
    include: {
      user: true,
      collector: true,
      ratings: {
        select: { fromUserId: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return pickups.map<PickupRequestCard>((pickup) => ({
    id: pickup.id,
    requestNo: pickup.requestNo,
    wasteType: pickup.wasteType,
    estimatedWeightKg: pickup.estimatedWeightKg,
    actualWeightKg: pickup.actualWeightKg,
    pricePerKgSnapshot: pickup.pricePerKgSnapshot,
    estimatedTotalAmount: pickup.estimatedTotalAmount,
    finalTotalAmount: pickup.finalTotalAmount,
    status: pickup.status,
    pickupSlot: pickup.pickupSlot,
    areaLabel: pickup.areaLabel,
    addressText: pickup.addressText,
    latitude: pickup.latitude,
    longitude: pickup.longitude,
    routeDistanceMeters: pickup.routeDistanceMeters,
    routeDurationSeconds: pickup.routeDurationSeconds,
    routeProvider: pickup.routeProvider,
    routeCalculatedAt: pickup.routeCalculatedAt,
    rejectionHistory: parsePickupRejectionHistory(pickup.rejectionHistory),
    requiresUserDecision: pickup.requiresUserDecision,
    userAlertType: pickup.userAlertType,
    userAlertMessage: pickup.userAlertMessage,
    userAlertAcknowledgedAt: pickup.userAlertAcknowledgedAt,
    autoCancelledAt: pickup.autoCancelledAt,
    autoCancelledReason: pickup.autoCancelledReason,
    createdAt: pickup.createdAt,
    scheduledAt: pickup.scheduledAt,
    completedAt: pickup.completedAt,
    photoUrl: pickup.photoUrl,
    notes: pickup.notes,
    collectorNote: pickup.collectorNote,
    userName: pickup.user.name,
    userEmail: pickup.user.email,
    userLatitude: pickup.user.latitude,
    userLongitude: pickup.user.longitude,
    collectorName: pickup.collector?.name ?? null,
    collectorLatitude: pickup.collector?.latitude ?? null,
    collectorLongitude: pickup.collector?.longitude ?? null,
    batchId: pickup.batchId,
    cancellationReason: pickup.cancellationReason,
    hasUserRated: pickup.ratings.some((r) => r.fromUserId === pickup.userId),
  }));
}

export async function getPickupsExportRows(
  profileId: string,
  role: Role,
  filters?: {
    status?: string;
  },
) {
  const pickups = await getPickupsForProfile(profileId, role, filters);

  return pickups.map((pickup) => ({
    id: pickup.id,
    request_no: pickup.requestNo,
    status: pickup.status,
    waste_type: pickup.wasteType,
    slot: pickup.pickupSlot,
    area: pickup.areaLabel,
    address: pickup.addressText,
    user_name: pickup.userName,
    collector_name: pickup.collectorName,
    estimated_weight_kg: pickup.estimatedWeightKg,
    actual_weight_kg: pickup.actualWeightKg,
    price_per_kg: pickup.pricePerKgSnapshot,
    estimated_total: pickup.estimatedTotalAmount,
    final_total: pickup.finalTotalAmount,
    created_at: pickup.createdAt.toISOString(),
  }));
}

export async function getPickupDetailForProfile({
  pickupId,
  profileId,
  role,
}: {
  pickupId: string;
  profileId: string;
  role: Role;
}) {
  await expireTimedOutPendingPickups();
  const pickup = await db.pickupRequest.findUnique({
    where: { id: pickupId },
    include: {
      user: true,
      collector: true,
      transaction: true,
      ratings: {
        select: { fromUserId: true }
      }
    },
  });

  if (!pickup) {
    return null;
  }

  const allowed = role === Role.ADMIN || pickup.userId === profileId || pickup.collectorId === profileId;
  if (!allowed) {
    return null;
  }

  return {
    id: pickup.id,
    requestNo: pickup.requestNo,
    wasteType: pickup.wasteType,
    estimatedWeightKg: pickup.estimatedWeightKg,
    actualWeightKg: pickup.actualWeightKg,
    pricePerKgSnapshot: pickup.pricePerKgSnapshot,
    estimatedTotalAmount: pickup.estimatedTotalAmount,
    finalTotalAmount: pickup.finalTotalAmount,
    status: pickup.status,
    pickupSlot: pickup.pickupSlot,
    areaLabel: pickup.areaLabel,
    addressText: pickup.addressText,
    latitude: pickup.latitude,
    longitude: pickup.longitude,
    routeDistanceMeters: pickup.routeDistanceMeters,
    routeDurationSeconds: pickup.routeDurationSeconds,
    routeProvider: pickup.routeProvider,
    routeCalculatedAt: pickup.routeCalculatedAt,
    rejectionHistory: parsePickupRejectionHistory(pickup.rejectionHistory),
    requiresUserDecision: pickup.requiresUserDecision,
    userAlertType: pickup.userAlertType,
    userAlertMessage: pickup.userAlertMessage,
    userAlertAcknowledgedAt: pickup.userAlertAcknowledgedAt,
    autoCancelledAt: pickup.autoCancelledAt,
    autoCancelledReason: pickup.autoCancelledReason,
    createdAt: pickup.createdAt,
    scheduledAt: pickup.scheduledAt,
    completedAt: pickup.completedAt,
    photoUrl: pickup.photoUrl,
    notes: pickup.notes,
    collectorNote: pickup.collectorNote,
    userName: pickup.user.name,
    userEmail: pickup.user.email,
    userLatitude: pickup.user.latitude,
    userLongitude: pickup.user.longitude,
    collectorName: pickup.collector?.name ?? null,
    collectorLatitude: pickup.collector?.latitude ?? null,
    collectorLongitude: pickup.collector?.longitude ?? null,
    collectorEmail: pickup.collector?.email ?? null,
    batchId: pickup.batchId,
    cancellationReason: pickup.cancellationReason,
    hasUserRated: pickup.ratings?.some((r) => r.fromUserId === pickup.userId) ?? false,
  } satisfies PickupDetailData;
}

export async function getRatingsForUser(profileId: string) {
  const completedPickups = await db.pickupRequest.findMany({
    where: { userId: profileId, status: "SELESAI", collectorId: { not: null } },
    include: {
      collector: { select: { name: true } },
      ratings: { where: { fromUserId: profileId } },
    },
    orderBy: { completedAt: "desc" },
    take: 30,
  });

  return completedPickups.map((pickup) => ({
    pickupId: pickup.id,
    requestNo: pickup.requestNo,
    wasteType: pickup.wasteType,
    collectorName: pickup.collector?.name ?? null,
    completedAt: pickup.completedAt,
    rating: pickup.ratings[0] ?? null,
  }));
}

export async function getPickupByRequestNo(requestNo: string, userId: string) {
  return db.pickupRequest.findFirst({
    where: { requestNo, userId },
    select: {
      id: true,
      requestNo: true,
      wasteType: true,
      status: true,
      collectorId: true,
      collector: { select: { id: true, name: true } },
    },
  });
}

export async function getMyReports(profileId: string) {
  return db.chatReport.findMany({
    where: { reportedByUserId: profileId },
    select: {
      id: true,
      reason: true,
      status: true,
      adminDecision: true,
      createdAt: true,
      reviewedAt: true,
      reportedUser: { select: { name: true } },
      thread: {
        select: {
          pickupRequest: { select: { requestNo: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getPickupStatusOptions() {
  return [
    PickupStatus.MENUNGGU_MATCHING,
    PickupStatus.TERJADWAL,
    PickupStatus.DALAM_PERJALANAN,
    PickupStatus.SELESAI,
    PickupStatus.DIBATALKAN,
  ];
}
