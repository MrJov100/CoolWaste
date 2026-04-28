import { PickupStatus } from "@prisma/client";

import { db } from "@/lib/db";

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getJakartaDayBounds(now = new Date()) {
  const shiftedNow = new Date(now.getTime() + JAKARTA_OFFSET_MS);
  const startOfShiftedDay = Date.UTC(
    shiftedNow.getUTCFullYear(),
    shiftedNow.getUTCMonth(),
    shiftedNow.getUTCDate(),
  );

  return {
    start: new Date(startOfShiftedDay - JAKARTA_OFFSET_MS),
    end: new Date(startOfShiftedDay + DAY_MS - JAKARTA_OFFSET_MS),
  };
}

export async function syncCollectorDailyLoads(collectorIds: string[]) {
  if (!collectorIds.length) {
    return {
      loadMap: new Map<string, number>(),
      usedMap: new Map<string, number>(),
    };
  }

  const uniqueCollectorIds = [...new Set(collectorIds)];
  const { start, end } = getJakartaDayBounds();

  // Fetch active pickups (TERJADWAL + DALAM_PERJALANAN) — these count toward matching capacity.
  // Include pickups with scheduledAt within today OR scheduledAt null (batch accepted, not yet assigned).
  const [activePickups, completedPickups] = await Promise.all([
    db.pickupRequest.findMany({
      where: {
        collectorId: { in: uniqueCollectorIds },
        status: { in: [PickupStatus.TERJADWAL, PickupStatus.DALAM_PERJALANAN] },
        OR: [
          { scheduledAt: { gte: start, lt: end } },
          { scheduledAt: null },
        ],
      },
      select: { collectorId: true, estimatedWeightKg: true },
    }),
    // Completed pickups today — use actualWeightKg for display accuracy.
    db.pickupRequest.findMany({
      where: {
        collectorId: { in: uniqueCollectorIds },
        status: PickupStatus.SELESAI,
        completedAt: { gte: start, lt: end },
      },
      select: { collectorId: true, actualWeightKg: true, estimatedWeightKg: true },
    }),
  ]);

  // loadMap = active weight only (used for capacity matching)
  const loadMap = new Map<string, number>();
  // usedMap = active + completed today (used for display "terpakai hari ini")
  const usedMap = new Map<string, number>();

  for (const collectorId of uniqueCollectorIds) {
    loadMap.set(collectorId, 0);
    usedMap.set(collectorId, 0);
  }

  for (const pickup of activePickups) {
    if (pickup.collectorId) {
      const prev = loadMap.get(pickup.collectorId) ?? 0;
      loadMap.set(pickup.collectorId, prev + pickup.estimatedWeightKg);
      usedMap.set(pickup.collectorId, (usedMap.get(pickup.collectorId) ?? 0) + pickup.estimatedWeightKg);
    }
  }

  for (const pickup of completedPickups) {
    if (pickup.collectorId) {
      const weight = pickup.actualWeightKg ?? pickup.estimatedWeightKg;
      usedMap.set(pickup.collectorId, (usedMap.get(pickup.collectorId) ?? 0) + weight);
    }
  }

  await Promise.all(
    uniqueCollectorIds.map((collectorId) =>
      db.profile.update({
        where: { id: collectorId },
        data: { currentLoadKg: loadMap.get(collectorId) ?? 0 },
      }),
    ),
  );

  return { loadMap, usedMap };
}

export async function syncCollectorDailyLoad(collectorId: string) {
  const { loadMap } = await syncCollectorDailyLoads([collectorId]);
  return loadMap.get(collectorId) ?? 0;
}
