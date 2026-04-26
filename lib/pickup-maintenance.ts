import { ChatThreadStatus, PickupStatus, Role, VerificationState, WasteType } from "@prisma/client";

import { db } from "@/lib/db";
import { syncCollectorDailyLoads } from "@/lib/collector-load";
import { calculateDistanceKm } from "@/lib/maps";
import { createNotification } from "@/lib/notifications";
import {
  PICKUP_BUSY_MESSAGE,
  PICKUP_TIMEOUT_MINUTES,
  USER_REJECTION_DECISION_THRESHOLD,
  parsePickupRejectionHistory,
  summarizePickupRejections,
} from "@/lib/pickup-alerts";

export async function cancelPickupAsBusy(pickupId: string, message = PICKUP_BUSY_MESSAGE) {
  const pickup = await db.pickupRequest.findUnique({
    where: { id: pickupId },
    select: { id: true, userId: true, requestNo: true },
  });

  await db.$transaction([
    db.pickupRequest.update({
      where: { id: pickupId },
      data: {
        status: PickupStatus.DIBATALKAN,
        cancellationReason: message,
        userAlertType: "BUSY",
        userAlertMessage: message,
        userAlertAcknowledgedAt: null,
        requiresUserDecision: false,
        autoCancelledAt: new Date(),
        autoCancelledReason: message,
        batchId: null,
        collectorId: null,
        routeDistanceMeters: null,
        routeDurationSeconds: null,
        routeProvider: null,
        routeCalculatedAt: null,
      },
    }),
    db.chatThread.updateMany({
      where: { pickupRequestId: pickupId },
      data: {
        status: ChatThreadStatus.CLOSED,
      },
    }),
  ]);

  if (pickup) {
    await createNotification({
      profileId: pickup.userId,
      type: "PICKUP_DIBATALKAN",
      title: "Pickup dibatalkan oleh sistem",
      body: `Pickup #${pickup.requestNo} dibatalkan karena tidak ada collector tersedia. Silakan buat request baru.`,
      pickupRequestId: pickup.id,
    });
  }
}

export async function expireTimedOutPendingPickups() {
  const timeoutThreshold = new Date(Date.now() - PICKUP_TIMEOUT_MINUTES * 60 * 1000);
  const timedOutPickups = await db.pickupRequest.findMany({
    where: {
      status: PickupStatus.MENUNGGU_MATCHING,
      createdAt: {
        lte: timeoutThreshold,
      },
    },
    select: { id: true },
    take: 50,
  });

  for (const pickup of timedOutPickups) {
    await cancelPickupAsBusy(pickup.id);
  }
}

export async function getAssignableCollectors(params: {
  wasteType: WasteType;
  areaLabel: string;
  latitude?: number | null;
  longitude?: number | null;
  estimatedWeightKg: number;
  rejectedCollectorIds: string[];
}) {
  const collectors = await db.profile.findMany({
    where: {
      role: Role.COLLECTOR,
      verificationState: VerificationState.VERIFIED,
      acceptedWasteTypes: { has: params.wasteType },
      dailyCapacityKg: { not: null },
      serviceRadiusKm: { not: null },
    },
    orderBy: [{ currentLoadKg: "asc" }, { updatedAt: "desc" }],
  });

  const loadMap = await syncCollectorDailyLoads(collectors.map((collector) => collector.id));

  const areaCollectors = collectors
    .map((collector) => {
      const currentLoadKg = loadMap.get(collector.id) ?? 0;
      const remainingCapacity = Math.max((collector.dailyCapacityKg ?? 0) - currentLoadKg, 0);
      const sameArea =
        collector.serviceAreaLabel?.toLowerCase().includes(params.areaLabel.toLowerCase()) ||
        params.areaLabel.toLowerCase().includes((collector.serviceAreaLabel ?? "").toLowerCase()) ||
        collector.address?.toLowerCase().includes(params.areaLabel.toLowerCase());
      const distanceKm = calculateDistanceKm(
        params.latitude,
        params.longitude,
        collector.latitude,
        collector.longitude,
      );
      const withinRadius = distanceKm != null ? distanceKm <= (collector.serviceRadiusKm ?? 0) : sameArea;

      return {
        collector,
        distanceKm,
        remainingCapacity,
        currentLoadKg,
        withinRadius,
      };
    })
    .filter((item) => item.remainingCapacity >= params.estimatedWeightKg && item.withinRadius);

  const eligibleCollectors = areaCollectors
    .filter((item) => !params.rejectedCollectorIds.includes(item.collector.id))
    .sort((left, right) => {
      if (left.distanceKm != null && right.distanceKm != null) {
        return left.distanceKm - right.distanceKm;
      }

      if (left.distanceKm != null) {
        return -1;
      }

      if (right.distanceKm != null) {
        return 1;
      }

      if (left.remainingCapacity !== right.remainingCapacity) {
        return right.remainingCapacity - left.remainingCapacity;
      }

      return left.currentLoadKg - right.currentLoadKg;
    });

  return {
    allCollectors: collectors,
    areaCollectors,
    eligibleCollectors,
  };
}

export async function evaluatePickupMatchingState(pickupId: string) {
  const pickup = await db.pickupRequest.findUniqueOrThrow({
    where: { id: pickupId },
  });

  if (pickup.status !== PickupStatus.MENUNGGU_MATCHING) {
    return { outcome: "ignored" as const };
  }

  const { areaCollectors, eligibleCollectors } = await getAssignableCollectors({
    wasteType: pickup.wasteType,
    areaLabel: pickup.areaLabel,
    latitude: pickup.latitude,
    longitude: pickup.longitude,
    estimatedWeightKg: pickup.estimatedWeightKg,
    rejectedCollectorIds: pickup.rejectedCollectorIds,
  });

  const rejectionHistory = parsePickupRejectionHistory(pickup.rejectionHistory);
  const latestRejectionAt = rejectionHistory[rejectionHistory.length - 1]?.rejectedAt;
  const shouldPromptUserDecision =
    pickup.rejectedCollectorIds.length >= USER_REJECTION_DECISION_THRESHOLD &&
    (!pickup.userAlertAcknowledgedAt ||
      (latestRejectionAt != null && new Date(latestRejectionAt) > pickup.userAlertAcknowledgedAt));

  if (shouldPromptUserDecision && areaCollectors.length > pickup.rejectedCollectorIds.length) {
    await db.pickupRequest.update({
      where: { id: pickup.id },
      data: {
        requiresUserDecision: true,
        userAlertType: "REJECTION_SUMMARY",
        userAlertMessage: summarizePickupRejections(rejectionHistory),
        userAlertAcknowledgedAt: null,
        collectorId: null,
        batchId: null,
        routeDistanceMeters: null,
        routeDurationSeconds: null,
        routeProvider: null,
        routeCalculatedAt: null,
      },
    });

    return { outcome: "needs_user_decision" as const };
  }

  if (!eligibleCollectors.length) {
    if (areaCollectors.length === 0 || pickup.rejectedCollectorIds.length >= areaCollectors.length) {
      await cancelPickupAsBusy(pickup.id);
      return { outcome: "auto_cancelled" as const };
    }

    if (shouldPromptUserDecision) {
      await db.pickupRequest.update({
        where: { id: pickup.id },
        data: {
          requiresUserDecision: true,
          userAlertType: "REJECTION_SUMMARY",
          userAlertMessage: summarizePickupRejections(rejectionHistory),
          userAlertAcknowledgedAt: null,
          collectorId: null,
          batchId: null,
          routeDistanceMeters: null,
          routeDurationSeconds: null,
          routeProvider: null,
          routeCalculatedAt: null,
        },
      });

      return { outcome: "needs_user_decision" as const };
    }

    return { outcome: "no_candidate_yet" as const };
  }

  if (pickup.requiresUserDecision) {
    return { outcome: "waiting_user_decision" as const };
  }

  return {
    outcome: "assignable" as const,
    candidate: eligibleCollectors[0]?.collector ?? null,
  };
}
