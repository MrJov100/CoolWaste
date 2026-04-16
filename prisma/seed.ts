import {
  BatchStatus,
  PaymentMethod,
  PaymentStatus,
  PickupSlot,
  PickupStatus,
  PrismaClient,
  Role,
  TransactionType,
  VerificationState,
  WasteType,
} from "@prisma/client";

const prisma = new PrismaClient();

function estimateTotal(pricePerKg: number, weight: number) {
  return Math.round(pricePerKg * weight);
}

async function main() {
  await prisma.rating.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.pickupRequest.deleteMany();
  await prisma.pickupBatch.deleteMany();
  await prisma.savedAddress.deleteMany();
  await prisma.profile.deleteMany();

  const [admin, collectorA, collectorB, userA, userB] = await Promise.all([
    prisma.profile.create({
      data: {
        email: "admin@smartwaste.id",
        name: "Admin Smart Waste",
        role: Role.ADMIN,
        address: "Jakarta Command Center",
      },
    }),
    prisma.profile.create({
      data: {
        email: "andika@example.com",
        name: "Andika Collector",
        role: Role.COLLECTOR,
        address: "Cimahi Selatan",
        verificationState: VerificationState.VERIFIED,
        serviceAreaLabel: "Cimahi Selatan",
        serviceRadiusKm: 5,
        dailyCapacityKg: 100,
        currentLoadKg: 32,
        wastePricing: {
          PLASTIC: 3000,
          PAPER: 2000,
          ORGANIC: 1000,
          METAL: 5000,
          GLASS: 1500,
        },
        acceptedWasteTypes: [WasteType.PLASTIC, WasteType.PAPER],
      },
    }),
    prisma.profile.create({
      data: {
        email: "dini.collector@example.com",
        name: "Dini Recycle Hub",
        role: Role.COLLECTOR,
        address: "Bandung Barat",
        verificationState: VerificationState.PENDING,
        serviceAreaLabel: "Bandung Barat",
        serviceRadiusKm: 7,
        dailyCapacityKg: 120,
        currentLoadKg: 0,
        wastePricing: {
          PLASTIC: 3200,
          PAPER: 2200,
          ORGANIC: 1200,
          METAL: 5400,
          GLASS: 1800,
        },
        acceptedWasteTypes: [WasteType.PLASTIC, WasteType.METAL, WasteType.GLASS],
      },
    }),
    prisma.profile.create({
      data: {
        email: "budi@example.com",
        name: "Budi Santoso",
        role: Role.USER,
        saldo: 78000,
        address: "Jl. Anggrek 12, Cimahi Selatan",
      },
    }),
    prisma.profile.create({
      data: {
        email: "siti@example.com",
        name: "Siti Aminah",
        role: Role.USER,
        saldo: 35500,
        address: "Jl. Melati 4, Cimahi Selatan",
      },
    }),
  ]);

  const [addressA, addressB] = await Promise.all([
    prisma.savedAddress.create({
      data: {
        profileId: userA.id,
        label: "Rumah",
        address: "Jl. Anggrek 12, Cimahi Selatan",
        isDefault: true,
      },
    }),
    prisma.savedAddress.create({
      data: {
        profileId: userB.id,
        label: "Rumah",
        address: "Jl. Melati 4, Cimahi Selatan",
        isDefault: true,
      },
    }),
  ]);

  const batch = await prisma.pickupBatch.create({
    data: {
      collectorId: collectorA.id,
      serviceAreaLabel: "Cimahi Selatan",
      pickupSlot: PickupSlot.PAGI,
      totalEstimatedWeight: 7.5,
      totalStops: 2,
      status: BatchStatus.TERJADWAL,
      scheduledFor: new Date(),
    },
  });

  const completedPickup = await prisma.pickupRequest.create({
    data: {
      requestNo: "SW-240001-AA11",
      userId: userA.id,
      collectorId: collectorA.id,
      batchId: batch.id,
      addressId: addressA.id,
      wasteType: WasteType.PLASTIC,
      estimatedWeightKg: 3,
      actualWeightKg: 3.2,
      pricePerKgSnapshot: 3000,
      estimatedTotalAmount: estimateTotal(3000, 3),
      finalTotalAmount: estimateTotal(3000, 3.2),
      addressText: addressA.address,
      areaLabel: "Cimahi Selatan",
      pickupSlot: PickupSlot.PAGI,
      status: PickupStatus.SELESAI,
      notes: "Botol plastik sudah dipilah.",
      collectorNote: "Timbang di lokasi, user setuju.",
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.DIBAYAR,
      completedAt: new Date(),
    },
  });

  await prisma.pickupRequest.create({
    data: {
      requestNo: "SW-240002-BB22",
      userId: userB.id,
      collectorId: collectorA.id,
      batchId: batch.id,
      addressId: addressB.id,
      wasteType: WasteType.PAPER,
      estimatedWeightKg: 4.5,
      pricePerKgSnapshot: 1800,
      estimatedTotalAmount: estimateTotal(1800, 4.5),
      addressText: addressB.address,
      areaLabel: "Cimahi Selatan",
      pickupSlot: PickupSlot.PAGI,
      status: PickupStatus.TERJADWAL,
      notes: "Kardus dan HVS dipacking jadi dua bundel.",
      scheduledAt: new Date(),
    },
  });

  await prisma.pickupRequest.create({
    data: {
      requestNo: "SW-240003-CC33",
      userId: userA.id,
      wasteType: WasteType.METAL,
      estimatedWeightKg: 2.2,
      pricePerKgSnapshot: 6200,
      estimatedTotalAmount: estimateTotal(6200, 2.2),
      addressText: addressA.address,
      areaLabel: "Cimahi Selatan",
      pickupSlot: PickupSlot.SIANG,
      status: PickupStatus.MENUNGGU_MATCHING,
      notes: "Mayoritas kaleng aluminium minuman.",
    },
  });

  await prisma.pickupRequest.create({
    data: {
      requestNo: "SW-240004-DD44",
      userId: userB.id,
      wasteType: WasteType.GLASS,
      estimatedWeightKg: 1.8,
      pricePerKgSnapshot: 2500,
      estimatedTotalAmount: estimateTotal(2500, 1.8),
      addressText: addressB.address,
      areaLabel: "Cimahi Selatan",
      pickupSlot: PickupSlot.SORE,
      status: PickupStatus.DIBATALKAN,
      notes: "Botol kaca bening.",
    },
  });

  await prisma.transaction.create({
    data: {
      userId: userA.id,
      collectorId: collectorA.id,
      pickupRequestId: completedPickup.id,
      type: TransactionType.INCOME,
      amount: completedPickup.finalTotalAmount ?? completedPickup.estimatedTotalAmount,
      description: "Pickup SW-240001-AA11 selesai dan dibayar cash",
    },
  });

  await prisma.rating.create({
    data: {
      pickupRequestId: completedPickup.id,
      fromUserId: userA.id,
      toUserId: collectorA.id,
      score: 5,
      comment: "Collector datang tepat waktu dan timbangannya jelas.",
    },
  });

  console.log("Pickup flow seed complete", {
    admin: admin.email,
    verifiedCollector: collectorA.email,
    pendingCollector: collectorB.email,
    users: [userA.email, userB.email],
    batch: batch.id,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
