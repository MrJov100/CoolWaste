import type {
  BatchStatus,
  ChatReportStatus,
  ChatThreadStatus,
  PickupSlot,
  PickupStatus,
  Role,
  VerificationState,
  WasteType,
} from "@prisma/client";
import type { WastePricingMap } from "@/lib/constants";

export type PickupRejectionEntry = {
  collectorId: string;
  collectorName: string;
  reason: string;
  rejectedAt: string;
};

export type SummaryMetric = {
  label: string;
  value: string;
  hint: string;
};

export type HighlightStat = {
  label: string;
  value: string;
  note: string;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  location: string;
  totalWeight: number;
  totalIncome: number;
};

export type WasteBreakdownPoint = {
  type: WasteType;
  totalWeight: number;
  totalValue: number;
};

export type SmartWasteProfile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  saldo: number;
  address: string | null;
};

export type ProfileRecord = SmartWasteProfile & {
  authUserId?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  verificationState?: VerificationState;
  serviceAreaLabel?: string | null;
  serviceRadiusKm?: number | null;
  dailyCapacityKg?: number | null;
  currentLoadKg?: number;
  wastePricing?: WastePricingMap | null;
  acceptedWasteTypes?: WasteType[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type SavedAddressOption = {
  id: string;
  label: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
};

export type CollectorServiceCard = {
  id: string;
  collectorName: string;
  serviceAreaLabel: string;
  serviceRadiusKm: number;
  dailyCapacityKg: number;
  remainingCapacityKg: number;
  wastePricing: WastePricingMap;
  acceptedWasteTypes: WasteType[];
  verificationState: VerificationState;
};

export type PickupRequestCard = {
  id: string;
  requestNo: string;
  wasteType: WasteType;
  estimatedWeightKg: number;
  actualWeightKg: number | null;
  pricePerKgSnapshot: number;
  estimatedTotalAmount: number;
  finalTotalAmount: number | null;
  status: PickupStatus;
  pickupSlot: PickupSlot;
  areaLabel: string;
  addressText: string;
  latitude: number | null;
  longitude: number | null;
  routeDistanceMeters: number | null;
  routeDurationSeconds: number | null;
  routeProvider: string | null;
  routeCalculatedAt: Date | null;
  rejectionHistory?: PickupRejectionEntry[];
  requiresUserDecision?: boolean;
  userAlertType?: string | null;
  userAlertMessage?: string | null;
  userAlertAcknowledgedAt?: Date | null;
  autoCancelledAt?: Date | null;
  autoCancelledReason?: string | null;
  createdAt: Date;
  scheduledAt: Date | null;
  completedAt: Date | null;
  photoUrl: string | null;
  notes: string | null;
  collectorNote: string | null;
  userName: string;
  userEmail?: string;
  userLatitude?: number | null;
  userLongitude?: number | null;
  collectorName: string | null;
  collectorLatitude?: number | null;
  collectorLongitude?: number | null;
  batchId: string | null;
  cancellationReason: string | null;
  hasUserRated?: boolean;
};

export type CollectorBatchCard = {
  id: string;
  serviceAreaLabel: string;
  pickupSlot: PickupSlot;
  totalEstimatedWeight: number;
  totalActualWeight: number;
  totalStops: number;
  status: BatchStatus;
  scheduledFor: Date | null;
  collectorName: string;
  requests: PickupRequestCard[];
};

export type CollectorReviewEntry = {
  id: string;
  score: number;
  comment: string | null;
  createdAt: Date;
  pickupRequestNo: string;
};

export type TransactionListEntry = {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: Date;
  pickupRequestId: string | null;
  userName: string;
  collectorName: string | null;
};

export type PickupDetailData = PickupRequestCard & {
  collectorEmail: string | null;
};

export type ChatMessageEntry = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  content: string;
  isSystemMessage: boolean;
  createdAt: Date;
};

export type ChatThreadData = {
  id: string;
  pickupRequestId: string;
  pickupRequestNo?: string;
  participantName?: string;
  participantRole?: Role;
  userId: string;
  collectorId: string;
  status: ChatThreadStatus;
  expiresAt: Date | null;
  canSend: boolean;
  canReport: boolean;
  hasUnread?: boolean;
  lastMessageAt?: Date | null;
  messages: ChatMessageEntry[];
};

export type ChatReportEntry = {
  id: string;
  threadId: string;
  pickupRequestId: string;
  pickupRequestNo: string;
  reportedByName: string;
  reportedUserName: string;
  reason: string;
  status: ChatReportStatus;
  adminDecision: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  messageContent: string | null;
  transcript: ChatMessageEntry[];
};

type DashboardBase = {
  profile: ProfileRecord;
  summary: SummaryMetric[];
};

export type UserDashboardData = DashboardBase & {
  role: "USER";
  savedAddresses: SavedAddressOption[];
  availableCollectors: CollectorServiceCard[];
  myPickups: PickupRequestCard[];
  ongoingPickups: PickupRequestCard[];
  marketDemand: WasteBreakdownPoint[];
  marketplaceHighlights: HighlightStat[];
  achievements: string[];
};

export type CollectorDashboardData = DashboardBase & {
  role: "COLLECTOR";
  openBatches: CollectorBatchCard[];
  myPickups: PickupRequestCard[];
  serviceHighlights: HighlightStat[];
  ratingAverage: number;
  ratingCount: number;
  recentReviews: CollectorReviewEntry[];
};

export type AdminDashboardData = DashboardBase & {
  role: "ADMIN";
  systemHighlights: Array<{ label: string; value: string }>;
  recentPickups: PickupRequestCard[];
  chatReports: ChatReportEntry[];
  leaderboard: LeaderboardEntry[];
  wasteComposition: WasteBreakdownPoint[];
  storyPoints: string[];
  pendingCollectors: ProfileRecord[];
};

export type DashboardData = UserDashboardData | CollectorDashboardData | AdminDashboardData;
