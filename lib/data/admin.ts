import { PickupStatus, Role, VerificationState } from "@prisma/client";
import { db } from "@/lib/db";
import { CO2_PER_KG } from "@/lib/constants";
import type { WasteType } from "@prisma/client";

function co2Key(type: WasteType): keyof typeof CO2_PER_KG {
  return type.toLowerCase() as keyof typeof CO2_PER_KG;
}

export async function getAdminTransactions() {
  const transactions = await db.transaction.findMany({
    include: {
      user: { select: { name: true, email: true, role: true } },
      collector: { select: { name: true, email: true } },
      pickupRequest: { select: { requestNo: true, wasteType: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const total = await db.transaction.aggregate({ _sum: { amount: true } });

  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      createdAt: t.createdAt,
      userName: t.user.name,
      userEmail: t.user.email,
      userRole: t.user.role,
      collectorName: t.collector?.name ?? null,
      collectorEmail: t.collector?.email ?? null,
      pickupRequestNo: t.pickupRequest?.requestNo ?? null,
      wasteType: t.pickupRequest?.wasteType ?? null,
      pickupStatus: t.pickupRequest?.status ?? null,
    })),
    totalAmount: total._sum.amount ?? 0,
  };
}

export async function getAdminRatings() {
  const ratings = await db.rating.findMany({
    include: {
      fromUser: { select: { name: true, role: true } },
      toUser: { select: { name: true, role: true } },
      pickupRequest: { select: { requestNo: true, wasteType: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const aggregate = await db.rating.aggregate({
    _avg: { score: true },
    _count: true,
  });

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) {
    distribution[r.score] = (distribution[r.score] ?? 0) + 1;
  }

  return {
    ratings: ratings.map((r) => ({
      id: r.id,
      score: r.score,
      comment: r.comment,
      createdAt: r.createdAt,
      fromUserName: r.fromUser.name,
      fromUserRole: r.fromUser.role,
      toUserName: r.toUser.name,
      toUserRole: r.toUser.role,
      pickupRequestNo: r.pickupRequest.requestNo,
      wasteType: r.pickupRequest.wasteType,
    })),
    average: aggregate._avg.score ?? 0,
    totalCount: aggregate._count,
    distribution,
  };
}

export async function getAdminReports() {
  const reports = await db.chatReport.findMany({
    include: {
      reportedByUser: { select: { name: true, role: true, id: true } },
      reportedUser: { select: { name: true, role: true, id: true, verificationState: true } },
      thread: {
        include: {
          pickupRequest: { select: { requestNo: true, id: true } },
        },
      },
      message: { select: { content: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return reports.map((r) => ({
    id: r.id,
    reason: r.reason,
    status: r.status,
    adminDecision: r.adminDecision,
    createdAt: r.createdAt,
    reviewedAt: r.reviewedAt,
    reportedByName: r.reportedByUser.name,
    reportedByRole: r.reportedByUser.role,
    reportedById: r.reportedByUser.id,
    reportedUserName: r.reportedUser.name,
    reportedUserRole: r.reportedUser.role,
    reportedUserId: r.reportedUser.id,
    reportedUserVerification: r.reportedUser.verificationState,
    pickupRequestNo: r.thread.pickupRequest.requestNo,
    pickupRequestId: r.thread.pickupRequest.id,
    threadId: r.threadId,
    messageContent: r.message?.content ?? null,
  }));
}

export async function getAdminReportDetail(reportId: string) {
  const report = await db.chatReport.findUnique({
    where: { id: reportId },
    include: {
      reportedByUser: { select: { name: true, role: true, id: true } },
      reportedUser: { select: { name: true, role: true, id: true, verificationState: true } },
      thread: {
        include: {
          pickupRequest: {
            select: {
              requestNo: true,
              id: true,
              wasteType: true,
              status: true,
              addressText: true,
              areaLabel: true,
              pickupSlot: true,
              createdAt: true,
              completedAt: true,
            },
          },
          messages: {
            orderBy: { createdAt: "asc" },
            include: { sender: { select: { name: true, role: true } } },
          },
        },
      },
      message: { select: { content: true, id: true } },
    },
  });

  if (!report) return null;

  return {
    id: report.id,
    reason: report.reason,
    status: report.status,
    adminDecision: report.adminDecision,
    createdAt: report.createdAt,
    reviewedAt: report.reviewedAt,
    reportedByName: report.reportedByUser.name,
    reportedByRole: report.reportedByUser.role,
    reportedById: report.reportedByUser.id,
    reportedUserName: report.reportedUser.name,
    reportedUserRole: report.reportedUser.role,
    reportedUserId: report.reportedUser.id,
    reportedUserVerification: report.reportedUser.verificationState,
    pickupRequestNo: report.thread.pickupRequest.requestNo,
    pickupRequestId: report.thread.pickupRequest.id,
    pickupWasteType: report.thread.pickupRequest.wasteType,
    pickupStatus: report.thread.pickupRequest.status,
    pickupAddress: report.thread.pickupRequest.addressText,
    pickupArea: report.thread.pickupRequest.areaLabel,
    pickupSlot: report.thread.pickupRequest.pickupSlot,
    pickupCreatedAt: report.thread.pickupRequest.createdAt,
    pickupCompletedAt: report.thread.pickupRequest.completedAt,
    threadId: report.threadId,
    messageContent: report.message?.content ?? null,
    reportedMessageId: report.message?.id ?? null,
    transcript: report.thread.messages.map((m) => ({
      id: m.id,
      senderName: m.sender.name,
      senderRole: m.sender.role,
      content: m.content,
      isSystemMessage: m.isSystemMessage,
      createdAt: m.createdAt,
      isReported: m.id === report.messageId,
    })),
  };
}

export async function getAdminUsers() {
  const [users, collectors] = await Promise.all([
    db.profile.findMany({
      where: { role: Role.USER },
      include: {
        submittedPickups: {
          where: { status: PickupStatus.SELESAI },
          select: { actualWeightKg: true, finalTotalAmount: true, wasteType: true },
        },
        earnedTransactions: { select: { amount: true } },
        ratingsGiven: { select: { score: true } },
        chatReportsFiled: { select: { id: true } },
        chatReportsTargeted: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.profile.findMany({
      where: { role: Role.COLLECTOR },
      include: {
        assignedPickups: {
          where: { status: PickupStatus.SELESAI },
          select: { actualWeightKg: true, finalTotalAmount: true },
        },
        ratingsReceived: { select: { score: true } },
        chatReportsFiled: { select: { id: true } },
        chatReportsTargeted: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const mapUser = (u: typeof users[number]) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    address: u.address,
    phone: u.phone,
    verificationState: u.verificationState,
    createdAt: u.createdAt,
    completedPickups: u.submittedPickups.length,
    totalWeight: u.submittedPickups.reduce((s, p) => s + (p.actualWeightKg ?? 0), 0),
    totalIncome: u.earnedTransactions.reduce((s, t) => s + t.amount, 0),
    ratingsGiven: u.ratingsGiven.length,
    reportsFiled: u.chatReportsFiled.length,
    reportsReceived: u.chatReportsTargeted.length,
  });

  const mapCollector = (c: typeof collectors[number]) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    role: c.role,
    address: c.address,
    phone: c.phone,
    serviceAreaLabel: c.serviceAreaLabel,
    dailyCapacityKg: c.dailyCapacityKg,
    verificationState: c.verificationState,
    createdAt: c.createdAt,
    completedPickups: c.assignedPickups.length,
    totalWeight: c.assignedPickups.reduce((s, p) => s + (p.actualWeightKg ?? 0), 0),
    totalRevenue: c.assignedPickups.reduce((s, p) => s + (p.finalTotalAmount ?? 0), 0),
    ratingAverage: c.ratingsReceived.length
      ? c.ratingsReceived.reduce((s, r) => s + r.score, 0) / c.ratingsReceived.length
      : 0,
    ratingCount: c.ratingsReceived.length,
    reportsFiled: c.chatReportsFiled.length,
    reportsReceived: c.chatReportsTargeted.length,
  });

  return {
    users: users.map(mapUser),
    collectors: collectors.map(mapCollector),
  };
}

export async function getAdminCarbon() {
  const completed = await db.pickupRequest.findMany({
    where: { status: PickupStatus.SELESAI, actualWeightKg: { not: null } },
    select: { wasteType: true, actualWeightKg: true, completedAt: true, areaLabel: true },
  });

  const byType: Record<string, { weight: number; co2: number }> = {};
  let totalWeight = 0;
  let totalCo2 = 0;

  for (const p of completed) {
    const weight = p.actualWeightKg ?? 0;
    const co2 = CO2_PER_KG[co2Key(p.wasteType)] * weight;
    const key = p.wasteType;
    if (!byType[key]) byType[key] = { weight: 0, co2: 0 };
    byType[key].weight += weight;
    byType[key].co2 += co2;
    totalWeight += weight;
    totalCo2 += co2;
  }

  const byArea: Record<string, number> = {};
  for (const p of completed) {
    const co2 = CO2_PER_KG[co2Key(p.wasteType)] * (p.actualWeightKg ?? 0);
    byArea[p.areaLabel] = (byArea[p.areaLabel] ?? 0) + co2;
  }

  const topAreas = Object.entries(byArea)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([area, co2]) => ({ area, co2: Number(co2.toFixed(2)) }));

  return {
    totalWeight: Number(totalWeight.toFixed(2)),
    totalCo2: Number(totalCo2.toFixed(2)),
    byType: Object.entries(byType).map(([type, data]) => ({
      type,
      weight: Number(data.weight.toFixed(2)),
      co2: Number(data.co2.toFixed(2)),
    })),
    topAreas,
    treesEquivalent: Number((totalCo2 / 21).toFixed(1)),
    completedPickups: completed.length,
  };
}

export async function getOpenReportsCount() {
  return db.chatReport.count({ where: { status: "OPEN" } });
}

export async function getRecentReportsForNotification() {
  const reports = await db.chatReport.findMany({
    where: { status: { not: "RESOLVED" } },
    include: {
      reportedByUser: { select: { name: true } },
      reportedUser: { select: { name: true } },
      thread: { include: { pickupRequest: { select: { requestNo: true } } } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 8,
  });

  return reports.map((r) => ({
    id: r.id,
    reportedByName: r.reportedByUser.name,
    reportedUserName: r.reportedUser.name,
    reason: r.reason,
    pickupRequestNo: r.thread.pickupRequest.requestNo,
    createdAt: r.createdAt,
    status: r.status,
  }));
}

export async function getAdminStats() {
  const [
    totalUsers,
    totalCollectors,
    totalPickups,
    completedPickups,
    pendingPickups,
    cancelledPickups,
    transactionSum,
    openReports,
    pendingCollectors,
  ] = await Promise.all([
    db.profile.count({ where: { role: Role.USER } }),
    db.profile.count({ where: { role: Role.COLLECTOR } }),
    db.pickupRequest.count(),
    db.pickupRequest.count({ where: { status: PickupStatus.SELESAI } }),
    db.pickupRequest.count({ where: { status: PickupStatus.MENUNGGU_MATCHING } }),
    db.pickupRequest.count({ where: { status: PickupStatus.DIBATALKAN } }),
    db.transaction.aggregate({ _sum: { amount: true } }),
    db.chatReport.count({ where: { status: "OPEN" } }),
    db.profile.count({ where: { role: Role.COLLECTOR, verificationState: VerificationState.PENDING } }),
  ]);

  return {
    totalUsers,
    totalCollectors,
    totalPickups,
    completedPickups,
    pendingPickups,
    cancelledPickups,
    completionRate: totalPickups > 0 ? Number(((completedPickups / totalPickups) * 100).toFixed(1)) : 0,
    totalRevenue: transactionSum._sum.amount ?? 0,
    openReports,
    pendingCollectors,
  };
}
