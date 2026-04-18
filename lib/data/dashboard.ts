import { BatchStatus, PickupStatus, Role, VerificationState, WasteType } from "@prisma/client";

import { normalizeWastePricingMap } from "@/lib/constants";
import { syncCollectorDailyLoad, syncCollectorDailyLoads } from "@/lib/collector-load";
import { countOpenChatReports, getChatReportsForAdmin } from "@/lib/data/chat";
import { db } from "@/lib/db";
import { expireTimedOutPendingPickups } from "@/lib/pickup-maintenance";
import { parsePickupRejectionHistory } from "@/lib/pickup-alerts";
import type {
  AdminDashboardData,
  CollectorBatchCard,
  CollectorDashboardData,
  CollectorReviewEntry,
  CollectorServiceCard,
  DashboardData,
  HighlightStat,
  LeaderboardEntry,
  PickupRequestCard,
  ProfileRecord,
  SavedAddressOption,
  SummaryMetric,
  UserDashboardData,
  WasteBreakdownPoint,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export async function getLandingStats() {
  const [profiles, collectors, pickups, transactions] = await Promise.all([
    db.profile.count(),
    db.profile.count({
      where: { role: Role.COLLECTOR, verificationState: VerificationState.VERIFIED },
    }),
    db.pickupRequest.aggregate({
      _sum: { estimatedWeightKg: true },
    }),
    db.transaction.aggregate({
      _sum: { amount: true },
    }),
  ]);

  return [
    { label: "Pengguna aktif", value: `${profiles}+`, hint: "akun user, collector, dan admin hidup di satu platform" },
    { label: "Collector siap jemput", value: `${collectors}+`, hint: "collector terverifikasi yang bisa ikut matching" },
    {
      label: "Volume pickup",
      value: `${Math.round(pickups._sum.estimatedWeightKg ?? 0)} kg`,
      hint: "estimasi berat yang sudah masuk ke sistem pickup",
    },
    {
      label: "Nilai transaksi",
      value: formatCurrency(transactions._sum.amount ?? 0),
      hint: "nilai ekonomi yang sudah diselesaikan collector",
    },
  ];
}

export async function getLeaderboardData() {
  const [entries, stats] = await Promise.all([
    db.profile.findMany({
      where: { role: Role.USER },
      include: {
        submittedPickups: { where: { status: PickupStatus.SELESAI } },
        earnedTransactions: true,
      },
      take: 20,
    }),
    db.pickupRequest.aggregate({
      where: { status: PickupStatus.SELESAI },
      _sum: { actualWeightKg: true },
      _count: { id: true },
    }),
  ]);

  const leaderboard: LeaderboardEntry[] = entries
    .map((item) => ({
      id: item.id,
      name: item.name,
      location: item.address ?? "Wilayah belum diisi",
      totalWeight: item.submittedPickups.reduce((sum, p) => sum + (p.actualWeightKg ?? 0), 0),
      totalIncome: item.earnedTransactions.reduce((sum, t) => sum + t.amount, 0),
    }))
    .sort((a, b) => b.totalWeight - a.totalWeight || b.totalIncome - a.totalIncome);

  return {
    leaderboard,
    totalWeight: stats._sum.actualWeightKg ?? 0,
    totalPickups: stats._count.id,
  };
}

export async function getDashboardData(profileId: string): Promise<DashboardData> {
  await expireTimedOutPendingPickups();
  const profile = await db.profile.findUniqueOrThrow({
    where: { id: profileId },
  });

  if (profile.role === Role.ADMIN) {
    return getAdminDashboard(profileId);
  }

  if (profile.role === Role.COLLECTOR) {
    return getCollectorDashboard(profileId);
  }

  return getUserDashboard(profileId);
}

export async function getPitchDeckData() {
  const adminProfile = await db.profile.findFirst({
    where: { role: Role.ADMIN },
    orderBy: { createdAt: "asc" },
  });

  if (!adminProfile) {
    throw new Error("Admin profile not found for pitch deck.");
  }

  const dashboard = await getAdminDashboard(adminProfile.id);
  const landing = await getLandingStats();

  return {
    profile: adminProfile,
    landing,
    dashboard,
    checklist: [
      "Tunjukkan user cukup isi jenis sampah, berat, lokasi, dan slot pickup dalam satu form singkat.",
      "Tampilkan collector menerima batch pickup, bukan request satu per satu.",
      "Perlihatkan status inti: menunggu matching, terjadwal, dalam perjalanan, selesai, dan dibatalkan.",
      "Buka halaman transaksi untuk bukti pembayaran COD yang sudah tercatat.",
      "Tutup dengan admin view yang menyorot collector pending verifikasi dan volume pickup.",
    ],
  };
}

async function getUserDashboard(profileId: string): Promise<UserDashboardData> {
  const collectorIds = (
    await db.profile.findMany({
      where: {
        role: Role.COLLECTOR,
        verificationState: VerificationState.VERIFIED,
      },
      select: { id: true },
    })
  ).map((collector) => collector.id);

  await syncCollectorDailyLoads(collectorIds);

  const [profile, savedAddresses, availableCollectors, myPickups, incomeSum, completedByType] = await Promise.all([
    db.profile.findUniqueOrThrow({ where: { id: profileId } }),
    db.savedAddress.findMany({
      where: { profileId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    db.profile.findMany({
      where: {
        role: Role.COLLECTOR,
        verificationState: VerificationState.VERIFIED,
      },
      orderBy: [{ currentLoadKg: "asc" }, { updatedAt: "desc" }],
      take: 6,
    }),
    db.pickupRequest.findMany({
      where: { userId: profileId },
      include: { user: true, collector: true, ratings: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.transaction.aggregate({
      where: { userId: profileId },
      _sum: { amount: true },
    }),
    db.pickupRequest.groupBy({
      by: ["wasteType"],
      where: { userId: profileId, status: PickupStatus.SELESAI },
      _sum: { actualWeightKg: true, finalTotalAmount: true },
      orderBy: { _sum: { actualWeightKg: "desc" } },
    }),
  ]);

  const waitingCount = myPickups.filter((item) => item.status === PickupStatus.MENUNGGU_MATCHING).length;
  const scheduledCount = myPickups.filter((item) => item.status === PickupStatus.TERJADWAL).length;
  const completedCount = myPickups.filter((item) => item.status === PickupStatus.SELESAI).length;

  return {
    role: "USER",
    profile: toProfileRecord(profile),
    summary: [
      metric("Saldo aktif", formatCurrency(profile.saldo), "saldo masuk setelah pickup diselesaikan dan dibayar"),
      metric("Alamat tersimpan", `${savedAddresses.length}`, "pilih alamat cepat saat membuat request pickup"),
      metric("Pickup aktif", `${waitingCount + scheduledCount}`, "request yang masih menunggu atau sudah dijadwalkan"),
      metric("Income berhasil", formatCurrency(incomeSum._sum.amount ?? 0), "total pemasukan dari pickup selesai"),
    ],
    savedAddresses: savedAddresses.map<SavedAddressOption>((address) => ({
      id: address.id,
      label: address.label,
      address: address.address,
      latitude: address.latitude,
      longitude: address.longitude,
      isDefault: address.isDefault,
    })),
    availableCollectors: availableCollectors.map<CollectorServiceCard>((collector) => ({
      id: collector.id,
      collectorName: collector.name,
      serviceAreaLabel: collector.serviceAreaLabel ?? collector.address ?? "Area belum diatur",
      serviceRadiusKm: collector.serviceRadiusKm ?? 0,
      dailyCapacityKg: collector.dailyCapacityKg ?? 0,
      remainingCapacityKg: Math.max((collector.dailyCapacityKg ?? 0) - collector.currentLoadKg, 0),
      wastePricing: normalizeWastePricingMap(collector.wastePricing),
      acceptedWasteTypes: collector.acceptedWasteTypes,
      verificationState: collector.verificationState,
    })),
    myPickups: myPickups.map(toPickupCard),
    marketDemand: completedByType.map<WasteBreakdownPoint>((item) => ({
      type: item.wasteType,
      totalWeight: item._sum.actualWeightKg ?? 0,
      totalValue: item._sum.finalTotalAmount ?? 0,
    })),
    marketplaceHighlights: [
      highlight("Menunggu matching", `${waitingCount}`, "sistem sedang mencari collector dan batch terbaik"),
      highlight("Sudah dijadwalkan", `${scheduledCount}`, "pickup sudah masuk rute collector"),
      highlight("Selesai dibayar", `${completedCount}`, "pickup yang sudah diverifikasi dan dibayar COD"),
    ],
    achievements: buildUserAchievements({
      totalIncome: incomeSum._sum.amount ?? 0,
      completedPickups: completedCount,
      waitingCount,
    }),
  };
}

async function getCollectorDashboard(profileId: string): Promise<CollectorDashboardData> {
  const currentLoadKg = await syncCollectorDailyLoad(profileId);
  const [profile, openBatches, myPickups, ratingsReceived] = await Promise.all([
    db.profile.findUniqueOrThrow({ where: { id: profileId } }),
    db.pickupBatch.findMany({
      where: {
        collectorId: profileId,
        status: {
          in: [BatchStatus.MENUNGGU_KONFIRMASI, BatchStatus.TERJADWAL, BatchStatus.DALAM_PERJALANAN],
        },
      },
      include: {
        collector: true,
        requests: {
          include: {
            user: true,
            collector: true,
            ratings: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.pickupRequest.findMany({
      where: { collectorId: profileId },
      include: { user: true, collector: true, ratings: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.rating.findMany({
      where: { toUserId: profileId },
      include: {
        pickupRequest: {
          select: { requestNo: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const pendingBatchCount = openBatches.filter((item) => item.status === BatchStatus.MENUNGGU_KONFIRMASI).length;
  const scheduledBatchCount = openBatches.filter((item) => item.status === BatchStatus.TERJADWAL).length;
  const completedWeight = myPickups
    .filter((item) => item.status === PickupStatus.SELESAI)
    .reduce((sum, item) => sum + (item.actualWeightKg ?? 0), 0);
  const ratingCount = ratingsReceived.length;
  const ratingAverage = ratingCount
    ? ratingsReceived.reduce((sum, item) => sum + item.score, 0) / ratingCount
    : 0;

  return {
    role: "COLLECTOR",
    profile: toProfileRecord(profile),
    summary: [
      metric("Verifikasi", profile.verificationState === VerificationState.VERIFIED ? "Aktif" : "Pending", "collector hanya ikut matching setelah diverifikasi admin"),
      metric("Batch menunggu", `${pendingBatchCount}`, "batch baru yang bisa diterima atau ditolak"),
      metric("Rute berjalan", `${scheduledBatchCount}`, "batch yang sudah dijadwalkan ke lapangan"),
      metric("Berat selesai", `${completedWeight.toFixed(1)} kg`, "pickup yang sudah selesai dan dibayar"),
    ],
    openBatches: openBatches.map(toBatchCard),
    myPickups: myPickups.map(toPickupCard),
    serviceHighlights: [
      highlight("Area layanan", profile.serviceAreaLabel ?? "Belum diatur", "wilayah utama yang dipakai saat auto matching"),
      highlight("Kapasitas harian", `${(profile.dailyCapacityKg ?? 0).toFixed(0)} kg`, "kapasitas maksimal pickup dalam satu hari"),
      highlight("Load terpakai", `${currentLoadKg.toFixed(1)} kg`, "estimasi muatan pickup aktif yang sudah dijadwalkan hari ini"),
      highlight("Rating layanan", ratingCount ? `${ratingAverage.toFixed(1)}/5` : "Belum ada", "nilai rata-rata dari user tanpa membuka identitas pengulas"),
    ],
    ratingAverage,
    ratingCount,
    recentReviews: ratingsReceived.map<CollectorReviewEntry>((review) => ({
      id: review.id,
      score: review.score,
      comment: review.comment,
      createdAt: review.createdAt,
      pickupRequestNo: review.pickupRequest.requestNo,
    })),
  };
}

async function getAdminDashboard(profileId: string): Promise<AdminDashboardData> {
  const [profile, users, pickupStatuses, batchStatuses, financialSummary, recentPickups, wasteByType, leaderboardSource, pendingCollectors, chatReports, openChatReports] =
    await Promise.all([
      db.profile.findUniqueOrThrow({ where: { id: profileId } }),
      db.profile.groupBy({
        by: ["role"],
        _count: true,
      }),
      db.pickupRequest.groupBy({
        by: ["status"],
        _count: true,
      }),
      db.pickupBatch.groupBy({
        by: ["status"],
        _count: true,
      }),
      db.transaction.aggregate({
        _sum: { amount: true },
      }),
      db.pickupRequest.findMany({
        include: { user: true, collector: true, ratings: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      db.pickupRequest.groupBy({
        by: ["wasteType"],
        where: { status: PickupStatus.SELESAI },
        _sum: { actualWeightKg: true, finalTotalAmount: true },
        orderBy: { _sum: { actualWeightKg: "desc" } },
      }),
      db.profile.findMany({
        where: { role: Role.USER },
        include: {
          submittedPickups: {
            where: { status: PickupStatus.SELESAI },
          },
          earnedTransactions: true,
        },
        take: 5,
      }),
      db.profile.findMany({
        where: {
          role: Role.COLLECTOR,
          verificationState: VerificationState.PENDING,
        },
        orderBy: { createdAt: "asc" },
      }),
      getChatReportsForAdmin(),
      countOpenChatReports(),
    ]);

  const userMap = new Map(users.map((item) => [item.role, item._count]));
  const pickupMap = new Map(pickupStatuses.map((item) => [item.status, item._count]));
  const batchMap = new Map(batchStatuses.map((item) => [item.status, item._count]));

  return {
    role: "ADMIN",
    profile: toProfileRecord(profile),
    summary: [
      metric("Total user", `${userMap.get(Role.USER) ?? 0}`, "rumah tangga yang menjual sampah lewat pickup"),
      metric("Collector aktif", `${userMap.get(Role.COLLECTOR) ?? 0}`, "collector yang terdaftar di sistem"),
      metric("Pickup selesai", `${pickupMap.get(PickupStatus.SELESAI) ?? 0}`, "request yang sudah dibayar dan selesai"),
      metric("Nilai transaksi", formatCurrency(financialSummary._sum.amount ?? 0), "gross value dari pickup selesai"),
    ],
    systemHighlights: [
      { label: "Menunggu matching", value: `${pickupMap.get(PickupStatus.MENUNGGU_MATCHING) ?? 0}` },
      { label: "Batch terjadwal", value: `${batchMap.get(BatchStatus.TERJADWAL) ?? 0}` },
      { label: "Collector pending", value: `${pendingCollectors.length}` },
      { label: "Laporan chat", value: `${openChatReports}` },
    ],
    recentPickups: recentPickups.map(toPickupCard),
    chatReports,
    wasteComposition: wasteByType.map<WasteBreakdownPoint>((item) => ({
      type: item.wasteType,
      totalWeight: item._sum.actualWeightKg ?? 0,
      totalValue: item._sum.finalTotalAmount ?? 0,
    })),
    leaderboard: leaderboardSource
      .map<LeaderboardEntry>((item) => ({
        id: item.id,
        name: item.name,
        location: item.address ?? "Wilayah belum diisi",
        totalWeight: item.submittedPickups.reduce((sum, pickup) => sum + (pickup.actualWeightKg ?? 0), 0),
        totalIncome: item.earnedTransactions.reduce((sum, trx) => sum + trx.amount, 0),
      }))
      .sort((a, b) => b.totalIncome - a.totalIncome || b.totalWeight - a.totalWeight),
    storyPoints: [
      `${pickupMap.get(PickupStatus.MENUNGGU_MATCHING) ?? 0} pickup masih menunggu collector dan batching terbaik.`,
      `${batchMap.get(BatchStatus.DALAM_PERJALANAN) ?? 0} batch sedang berada di lapangan saat ini.`,
      `Total nilai ekonomi ${formatCurrency(financialSummary._sum.amount ?? 0)} memperlihatkan alur COD yang berjalan.`,
    ],
    pendingCollectors: pendingCollectors.map(toProfileRecord),
  };
}

function toProfileRecord(profile: {
  id: string;
  authUserId: string | null;
  email: string;
  name: string;
  role: Role;
  saldo: number;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  avatarUrl: string | null;
  verificationState: VerificationState;
  serviceAreaLabel: string | null;
  serviceRadiusKm: number | null;
  dailyCapacityKg: number | null;
  currentLoadKg: number;
  wastePricing: unknown;
  acceptedWasteTypes: WasteType[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...profile,
    wastePricing: normalizeWastePricingMap(profile.wastePricing),
  };
}

function toPickupCard(pickup: {
  id: string;
  requestNo: string;
  wasteType: WasteType;
  estimatedWeightKg: number;
  actualWeightKg: number | null;
  pricePerKgSnapshot: number;
  estimatedTotalAmount: number;
  finalTotalAmount: number | null;
  status: PickupStatus;
  pickupSlot: import("@prisma/client").PickupSlot;
  areaLabel: string;
  addressText: string;
  latitude: number | null;
  longitude: number | null;
  routeDistanceMeters: number | null;
  routeDurationSeconds: number | null;
  routeProvider: string | null;
  routeCalculatedAt: Date | null;
  rejectionHistory: unknown;
  requiresUserDecision: boolean;
  userAlertType: string | null;
  userAlertMessage: string | null;
  userAlertAcknowledgedAt: Date | null;
  autoCancelledAt: Date | null;
  autoCancelledReason: string | null;
  createdAt: Date;
  scheduledAt: Date | null;
  completedAt: Date | null;
  photoUrl: string | null;
  notes: string | null;
  cancellationReason: string | null;
  collectorNote: string | null;
  batchId: string | null;
  user: { name: string; email: string; id?: string; latitude: number | null; longitude: number | null };
  collector: { name: string; latitude: number | null; longitude: number | null } | null;
  ratings?: { fromUserId: string }[];
}): PickupRequestCard {
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
    cancellationReason: pickup.cancellationReason,
    userName: pickup.user.name,
    userEmail: pickup.user.email,
    userLatitude: pickup.user.latitude,
    userLongitude: pickup.user.longitude,
    collectorName: pickup.collector?.name ?? null,
    collectorLatitude: pickup.collector?.latitude ?? null,
    collectorLongitude: pickup.collector?.longitude ?? null,
    batchId: pickup.batchId,
    hasUserRated: pickup.ratings?.some((r) => r.fromUserId === pickup.user.id) ?? false,
  };
}

function toBatchCard(batch: {
  id: string;
  serviceAreaLabel: string;
  pickupSlot: import("@prisma/client").PickupSlot;
  totalEstimatedWeight: number;
  totalActualWeight: number;
  totalStops: number;
  status: BatchStatus;
  scheduledFor: Date | null;
  collector: { name: string };
  requests: Array<Parameters<typeof toPickupCard>[0]>;
}): CollectorBatchCard {
  return {
    id: batch.id,
    serviceAreaLabel: batch.serviceAreaLabel,
    pickupSlot: batch.pickupSlot,
    totalEstimatedWeight: batch.totalEstimatedWeight,
    totalActualWeight: batch.totalActualWeight,
    totalStops: batch.totalStops,
    status: batch.status,
    scheduledFor: batch.scheduledFor,
    collectorName: batch.collector.name,
    requests: batch.requests.map(toPickupCard),
  };
}

function metric(label: string, value: string, hint: string): SummaryMetric {
  return { label, value, hint };
}

function highlight(label: string, value: string, note: string): HighlightStat {
  return { label, value, note };
}

function buildUserAchievements({
  totalIncome,
  completedPickups,
  waitingCount,
}: {
  totalIncome: number;
  completedPickups: number;
  waitingCount: number;
}) {
  const achievements: string[] = [];

  if (completedPickups >= 1) {
    achievements.push("First Pickup: sampahmu sudah berhasil dijemput collector.");
  }

  if (totalIncome >= 10000) {
    achievements.push("Cashflow Ready: pickup sampah sudah memberi pemasukan nyata.");
  }

  if (waitingCount > 0) {
    achievements.push("On Queue: ada request yang sedang menunggu matching dan batching.");
  }

  if (!achievements.length) {
    achievements.push("Buat request pickup pertama dan biarkan sistem mencari collector terdekat.");
  }

  return achievements;
}
