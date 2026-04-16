import { BatchStatus, PickupStatus, Role } from "@prisma/client";

import { syncCollectorDailyLoad } from "@/lib/collector-load";
import { db } from "@/lib/db";

export async function getSettingsData(profileId: string) {
  const profile = await db.profile.findUniqueOrThrow({
    where: { id: profileId },
    include: {
      savedAddresses: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (profile.role === Role.COLLECTOR) {
    await syncCollectorDailyLoad(profileId);

    const refreshedProfile = await db.profile.findUniqueOrThrow({
      where: { id: profileId },
      include: {
        savedAddresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        },
      },
    });

    const activeBatchCount = await db.pickupBatch.count({
      where: {
        collectorId: profileId,
        status: {
          in: [BatchStatus.MENUNGGU_KONFIRMASI, BatchStatus.TERJADWAL, BatchStatus.DALAM_PERJALANAN],
        },
      },
    });

    return {
      profile: refreshedProfile,
      activeBatchCount,
    };
  }

  const activePickupCount = await db.pickupRequest.count({
    where: {
      userId: profileId,
      status: {
        in: [PickupStatus.MENUNGGU_MATCHING, PickupStatus.TERJADWAL, PickupStatus.DALAM_PERJALANAN],
      },
    },
  });

  return {
    profile,
    activePickupCount,
  };
}
