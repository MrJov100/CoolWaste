import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flag,
  MapPin,
  Route,
  Scale,
  Truck,
  User,
  Wallet,
  X,
} from "lucide-react";

import { PickupPhoto } from "@/components/records/pickup-photo";
import { PICKUP_SLOT_LABEL, PICKUP_STATUS_LABEL } from "@/lib/constants";
import { buildGoogleMapsDirectionsUrl } from "@/lib/maps";
import { formatDistanceMeters, formatDurationSeconds } from "@/lib/routing";
import type { PickupDetailData } from "@/lib/types";
import { formatCurrency, titleCase } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const WASTE_ICONS: Record<string, string> = {
  PLASTIC: "🧴",
  PAPER: "📄",
  ORGANIC: "🌿",
  METAL: "🔩",
  GLASS: "🫙",
};

const statusConfig = {
  MENUNGGU_MATCHING: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  TERJADWAL: { icon: CalendarClock, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  DALAM_PERJALANAN: { icon: Truck, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  SELESAI: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  DIBATALKAN: { icon: X, color: "text-slate-500", bg: "bg-slate-500/10 border-slate-500/20" },
} as const;

function InfoRow({ icon: Icon, label, value, highlight = false }: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`mt-0.5 text-sm font-medium ${highlight ? "text-emerald-300" : "text-white"}`}>{value}</p>
      </div>
    </div>
  );
}

export function PickupDetailCard({
  pickup,
  canNavigate = false,
  hidePendingCommercials = false,
}: {
  pickup: PickupDetailData;
  canNavigate?: boolean;
  hidePendingCommercials?: boolean;
}) {
  const shouldHideCommercials = hidePendingCommercials && pickup.status === "MENUNGGU_MATCHING";
  const formattedDistance = formatDistanceMeters(pickup.routeDistanceMeters);
  const formattedDuration = formatDurationSeconds(pickup.routeDurationSeconds);
  const directionsUrl = buildGoogleMapsDirectionsUrl({
    originLatitude: pickup.collectorLatitude,
    originLongitude: pickup.collectorLongitude,
    destinationLatitude: pickup.latitude,
    destinationLongitude: pickup.longitude,
  });

  const cfg = statusConfig[pickup.status];
  const StatusIcon = cfg.icon;
  const wasteIcon = WASTE_ICONS[pickup.wasteType] ?? "♻️";

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={`flex items-center gap-3 rounded-2xl border p-4 ${cfg.bg}`}>
        <StatusIcon className={`h-5 w-5 ${cfg.color}`} />
        <div>
          <p className={`font-semibold ${cfg.color}`}>{PICKUP_STATUS_LABEL[pickup.status]}</p>
          <p className="text-xs text-slate-400">Request #{pickup.requestNo}</p>
        </div>
        {pickup.status === "SELESAI" && pickup.completedAt && (
          <p className="ml-auto text-xs text-slate-500">
            Selesai {format(pickup.completedAt, "dd MMM yyyy, HH:mm")}
          </p>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        {/* Left column — details */}
        <div className="space-y-4">
          {/* Waste overview */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-4xl">{wasteIcon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{titleCase(pickup.wasteType)}</h2>
                <p className="text-sm text-slate-400">
                  Estimasi {pickup.estimatedWeightKg.toFixed(1)} kg
                  {pickup.actualWeightKg ? ` · Aktual ${pickup.actualWeightKg.toFixed(1)} kg` : ""}
                </p>
              </div>
            </div>

            {/* Financial */}
            <div className="grid grid-cols-2 gap-3">
              {!shouldHideCommercials ? (
                <>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <p className="text-xs text-slate-500">Harga/kg</p>
                    <p className="mt-1 text-lg font-bold text-white">{formatCurrency(pickup.pricePerKgSnapshot)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <p className="text-xs text-slate-500">
                      {pickup.finalTotalAmount ? "Nilai Final" : "Estimasi Nilai"}
                    </p>
                    <p className="mt-1 text-lg font-bold text-emerald-300">
                      {formatCurrency(pickup.finalTotalAmount ?? pickup.estimatedTotalAmount)}
                    </p>
                  </div>
                </>
              ) : (
                <div className="col-span-2 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3 text-center">
                  <p className="text-xs text-amber-400">Harga muncul setelah collector menerima</p>
                </div>
              )}
            </div>
          </div>

          {/* Info rows */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 space-y-2">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-slate-500">Detail Pickup</p>
            <InfoRow icon={CalendarClock} label="Dibuat" value={format(pickup.createdAt, "dd MMM yyyy, HH:mm")} />
            <InfoRow icon={Clock} label="Slot waktu" value={PICKUP_SLOT_LABEL[pickup.pickupSlot]} />
            {pickup.scheduledAt && (
              <InfoRow icon={CalendarClock} label="Jadwal pickup" value={format(pickup.scheduledAt, "dd MMM yyyy, HH:mm")} />
            )}
            <InfoRow icon={MapPin} label="Lokasi" value={pickup.addressText} />
            <InfoRow icon={User} label="User" value={`${pickup.userName} · ${pickup.userEmail ?? ""}`} />
            <InfoRow
              icon={Truck}
              label="Collector"
              value={pickup.collectorName ?? "Belum ditetapkan"}
            />
            {pickup.collectorEmail && (
              <InfoRow icon={User} label="Email collector" value={pickup.collectorEmail} />
            )}
          </div>

          {/* Route */}
          {!shouldHideCommercials && (formattedDistance || formattedDuration || (canNavigate && directionsUrl)) ? (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Route className="h-4 w-4 text-emerald-400" />
                <p className="text-sm font-medium text-white">Rute Collector ke Pickup</p>
              </div>
              <p className="text-base font-semibold text-slate-300">
                {formattedDistance ?? "Belum dihitung"}
                {formattedDuration ? ` · ${formattedDuration}` : ""}
              </p>
              {pickup.routeProvider && (
                <p className="mt-1 text-xs text-slate-600">
                  Via {pickup.routeProvider === "openrouteservice" ? "OpenRouteService" : "Haversine"}
                </p>
              )}
              {canNavigate && directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-3`}
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Buka Google Maps
                </a>
              )}
            </div>
          ) : null}

          {/* Report link for user */}
          {pickup.collectorName && (
            <Link
              href={`/report/${pickup.requestNo}`}
              className="flex items-center gap-2 rounded-2xl border border-red-500/15 bg-red-950/10 px-4 py-3 text-sm text-red-400 transition-all hover:bg-red-950/20"
            >
              <Flag className="h-4 w-4" /> Laporkan collector ini
              <ArrowRight className="ml-auto h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Right column — photo & notes */}
        <div className="space-y-4">
          {/* Photo */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-slate-500">Foto Sampah</p>
            <PickupPhoto photoUrl={pickup.photoUrl} wasteType={pickup.wasteType} />
          </div>

          {/* Notes */}
          {(pickup.notes || pickup.collectorNote || pickup.cancellationReason) && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Catatan</p>
              {pickup.notes && (
                <div className="rounded-2xl bg-white/[0.03] p-3">
                  <p className="mb-1 text-xs text-slate-500">Catatan user</p>
                  <p className="text-sm text-slate-300">{pickup.notes}</p>
                </div>
              )}
              {pickup.collectorNote && (
                <div className="rounded-2xl bg-emerald-950/20 p-3">
                  <p className="mb-1 text-xs text-emerald-500">Catatan collector</p>
                  <p className="text-sm text-emerald-300">{pickup.collectorNote}</p>
                </div>
              )}
              {pickup.cancellationReason && (
                <div className="rounded-2xl bg-red-950/20 p-3">
                  <p className="mb-1 text-xs text-red-500">Alasan pembatalan</p>
                  <p className="text-sm text-red-300">{pickup.cancellationReason}</p>
                </div>
              )}
            </div>
          )}

          {/* Completion info */}
          {pickup.completedAt && (
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/10 p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-300">Pickup Selesai</p>
              </div>
              {pickup.actualWeightKg && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Scale className="h-4 w-4" />
                  Berat aktual: <span className="font-medium text-white">{pickup.actualWeightKg.toFixed(1)} kg</span>
                </div>
              )}
              {pickup.finalTotalAmount && (
                <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                  <Wallet className="h-4 w-4" />
                  Nilai dibayar: <span className="font-semibold text-emerald-300">{formatCurrency(pickup.finalTotalAmount)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
