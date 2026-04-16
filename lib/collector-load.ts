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
    return new Map<string, number>();
  }

  const uniqueCollectorIds = [...new Set(collectorIds)];
  const { start, end } = getJakartaDayBounds();
  const groupedLoads = await db.pickupRequest.groupBy({
    by: ["collectorId"],
    where: {
      collectorId: { in: uniqueCollectorIds },
      status: {
        in: [PickupStatus.TERJADWAL, PickupStatus.DALAM_PERJALANAN],
      },
      scheduledAt: {
        gte: start,
        lt: end,
      },
    },
    _sum: {
      estimatedWeightKg: true,
    },
  });

  const loadMap = new Map<string, number>();
  for (const collectorId of uniqueCollectorIds) {
    loadMap.set(collectorId, 0);
  }

  for (const entry of groupedLoads) {
    if (entry.collectorId) {
      loadMap.set(entry.collectorId, entry._sum.estimatedWeightKg ?? 0);
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

  return loadMap;
}

export async function syncCollectorDailyLoad(collectorId: string) {
  const loadMap = await syncCollectorDailyLoads([collectorId]);
  return loadMap.get(collectorId) ?? 0;
}
