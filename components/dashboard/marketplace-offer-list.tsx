import Image from "next/image";
import Link from "next/link";
import { PaymentMethod, PickupStatus } from "@prisma/client";
import { format } from "date-fns";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Leaf,
  MapPin,
  Route,
  Scale,
  Star,
  Truck,
  X,
} from "lucide-react";

import type { PickupRequestCard } from "@/lib/types";
import { completePickupRequest, submitRating, cancelPickupRequest } from "@/lib/actions/dashboard";
import { buildGoogleMapsDirectionsUrl } from "@/lib/maps";
import { PICKUP_SLOT_LABEL, PICKUP_STATUS_LABEL } from "@/lib/constants";
import { formatDistanceMeters, formatDurationSeconds } from "@/lib/routing";
import { formatCurrency, titleCase } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const WASTE_ICONS: Record<string, string> = {
  PLASTIC: "🧴",
  PAPER: "📄",
  ORGANIC: "🌿",
  METAL: "🔩",
  GLASS: "🫙",
};

const statusConfig = {
  MENUNGGU_MATCHING: {
    variant: "amber" as const,
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  TERJADWAL: {
    variant: "emerald" as const,
    icon: CalendarClock,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  DALAM_PERJALANAN: {
    variant: "emerald" as const,
    icon: Truck,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  SELESAI: {
    variant: "emerald" as const,
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  DIBATALKAN: {
    variant: "slate" as const,
    icon: X,
    color: "text-slate-500",
    bg: "bg-slate-500/10 border-slate-500/20",
  },
} as const;

export function MarketplaceOfferList({
  title,
  description,
  offers,
  mode = "viewer",
  hidePendingCommercials = false,
  compact = false,
}: {
  title: string;
  description: string;
  offers: PickupRequestCard[];
  mode?: "viewer" | "collector";
  hidePendingCommercials?: boolean;
  compact?: boolean;
}) {
  const wrapper = compact ? "space-y-3" : "rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm";
  return (
    <div className={wrapper}>
      {!compact && (
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Pickup Activity</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-400">{description}</p>
        </div>
        <Link
          href="/pickups"
          className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 transition-all hover:border-white/20 hover:text-slate-200"
        >
          Lihat semua
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      )}

      <div className="space-y-4">
        {offers.length ? (
          offers.map((offer) => (
            <PickupCard
              key={offer.id}
              offer={offer}
              mode={mode}
              hidePendingCommercials={hidePendingCommercials}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/10 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
              <Leaf className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">Belum ada pickup</p>
            <p className="text-xs text-slate-600">Buat request pickup pertama dan mulai jual sampahmu</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PickupCard({
  offer,
  mode,
  hidePendingCommercials,
}: {
  offer: PickupRequestCard;
  mode: "viewer" | "collector";
  hidePendingCommercials: boolean;
}) {
  const shouldHideCommercials = hidePendingCommercials && offer.status === PickupStatus.MENUNGGU_MATCHING;
  const displayAmount = shouldHideCommercials ? null : (offer.finalTotalAmount ?? offer.estimatedTotalAmount);
  const cfg = statusConfig[offer.status];
  const StatusIcon = cfg.icon;
  const wasteIcon = WASTE_ICONS[offer.wasteType] ?? "♻️";

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] transition-all hover:border-white/20">
      {/* Top bar — status indicator */}
      <div className={`flex items-center gap-2 border-b border-white/5 px-5 py-2.5 ${cfg.bg}`}>
        <StatusIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
        <span className={`text-xs font-medium ${cfg.color}`}>{PICKUP_STATUS_LABEL[offer.status]}</span>
        <span className="ml-auto text-xs text-slate-600">{offer.requestNo}</span>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        {/* Photo */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-900">
          {offer.photoUrl ? (
            <Image src={offer.photoUrl} alt={offer.wasteType} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl">{wasteIcon}</div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-white">
                {wasteIcon} {titleCase(offer.wasteType)} · {offer.estimatedWeightKg.toFixed(1)} kg
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="h-3 w-3" />
                {offer.areaLabel}
                <span className="text-slate-600">·</span>
                <Clock className="h-3 w-3" />
                {PICKUP_SLOT_LABEL[offer.pickupSlot]}
              </p>
            </div>
            <div className="text-right">
              {displayAmount != null ? (
                <p className="text-lg font-semibold text-emerald-300">{formatCurrency(displayAmount)}</p>
              ) : (
                <p className="text-xs font-medium text-amber-300/80">Harga muncul setelah diterima</p>
              )}
              <p className="text-xs text-slate-600">{format(offer.createdAt, "dd MMM yyyy, HH:mm")}</p>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {offer.collectorName ? (
              <span className="flex items-center gap-1">
                <Truck className="h-3 w-3 text-slate-600" />
                {offer.collectorName}
              </span>
            ) : null}
            {offer.scheduledAt ? (
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3 text-slate-600" />
                {format(offer.scheduledAt, "dd MMM, HH:mm")}
              </span>
            ) : null}
            {offer.actualWeightKg ? (
              <span className="flex items-center gap-1">
                <Scale className="h-3 w-3 text-slate-600" />
                Aktual: {offer.actualWeightKg.toFixed(1)} kg
              </span>
            ) : null}
          </div>

          {offer.notes ? (
            <p className="rounded-xl bg-slate-950/40 px-3 py-2 text-xs text-slate-400">{offer.notes}</p>
          ) : null}
          {offer.collectorNote ? (
            <p className="rounded-xl bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
              Catatan collector: {offer.collectorNote}
            </p>
          ) : null}

          {/* Actions row */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link
              href={`/pickups/${offer.id}`}
              className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
            >
              Detail <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Route summary */}
          <RouteSummary offer={offer} showNavigation={mode === "collector"} hidden={shouldHideCommercials} />

          {/* Collector actions */}
          {mode === "collector" ? <CollectorActions offer={offer} /> : null}

          {/* Rating */}
          {mode !== "collector" && offer.status === "SELESAI" && !offer.hasUserRated ? (
            <RatingForm pickupId={offer.id} />
          ) : null}

          {/* Cancel */}
          {mode !== "collector" && (offer.status === "MENUNGGU_MATCHING" || offer.status === "TERJADWAL") ? (
            <CancelForm pickupId={offer.id} />
          ) : null}

          {/* Cancelled reason */}
          {offer.status === "DIBATALKAN" && offer.cancellationReason ? (
            <p className="rounded-xl border border-red-500/20 bg-red-950/30 px-3 py-2 text-xs text-red-300">
              Dibatalkan: {offer.cancellationReason}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RouteSummary({
  offer,
  showNavigation,
  hidden = false,
}: {
  offer: PickupRequestCard;
  showNavigation: boolean;
  hidden?: boolean;
}) {
  if (hidden) return null;
  const formattedDistance = formatDistanceMeters(offer.routeDistanceMeters);
  const formattedDuration = formatDurationSeconds(offer.routeDurationSeconds);
  const directionsUrl = buildGoogleMapsDirectionsUrl({
    originLatitude: offer.collectorLatitude,
    originLongitude: offer.collectorLongitude,
    destinationLatitude: offer.latitude,
    destinationLongitude: offer.longitude,
  });

  if (!formattedDistance && !formattedDuration && !directionsUrl) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.06] bg-slate-950/40 px-4 py-3">
      <Route className="h-4 w-4 text-emerald-300" />
      <div className="flex-1 text-xs text-slate-400">
        <span className="font-medium text-slate-300">Rute collector:</span>{" "}
        {formattedDistance ?? "Jarak belum tersedia"}
        {formattedDuration ? ` · ${formattedDuration}` : ""}
      </div>
      {showNavigation && directionsUrl ? (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
        >
          Google Maps <ExternalLink className="h-3 w-3" />
        </a>
      ) : null}
    </div>
  );
}

function CollectorActions({ offer }: { offer: PickupRequestCard }) {
  if (offer.status === PickupStatus.SELESAI || offer.status === PickupStatus.DIBATALKAN) return null;

  if (offer.status === PickupStatus.MENUNGGU_MATCHING) {
    return (
      <p className="rounded-2xl border border-white/[0.06] bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
        Pickup ini masih menunggu keputusan batch. Status akan berubah setelah batch diterima.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-slate-950/40 p-4">
      <p className="mb-3 text-xs font-medium text-slate-300">Selesaikan pickup</p>
      <form action={completePickupRequest.bind(null, offer.id)} className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`actualWeightKg-${offer.id}`} className="text-xs">Berat aktual (kg)</Label>
          <Input id={`actualWeightKg-${offer.id}`} name="actualWeightKg" type="number" min="0.1" step="0.1" placeholder="3.2" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`paymentMethod-${offer.id}`} className="text-xs">Pembayaran</Label>
          <Select id={`paymentMethod-${offer.id}`} name="paymentMethod" defaultValue={PaymentMethod.CASH}>
            <option value={PaymentMethod.CASH}>Cash</option>
            <option value={PaymentMethod.EWALLET}>E-Wallet</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`collectorNote-${offer.id}`} className="text-xs">Catatan</Label>
          <Input id={`collectorNote-${offer.id}`} name="collectorNote" placeholder="Opsional..." />
        </div>
        <div className="sm:col-span-3">
          <Button type="submit" size="sm">Selesai &amp; Dibayar</Button>
        </div>
      </form>
    </div>
  );
}

function RatingForm({ pickupId }: { pickupId: string }) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-amber-300">
        <Star className="h-4 w-4" /> Bagaimana pelayanan collector?
      </p>
      <form action={submitRating.bind(null, pickupId)} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <Select name="score" required defaultValue="5">
          <option value="5">⭐⭐⭐⭐⭐ Bagus Sekali</option>
          <option value="4">⭐⭐⭐⭐ Bagus</option>
          <option value="3">⭐⭐⭐ Biasa Saja</option>
          <option value="2">⭐⭐ Kurang</option>
          <option value="1">⭐ Sangat Buruk</option>
        </Select>
        <Input name="comment" placeholder="Komentar (opsional)..." />
        <Button type="submit" size="sm" variant="secondary">Kirim</Button>
      </form>
    </div>
  );
}

function CancelForm({ pickupId }: { pickupId: string }) {
  return (
    <div className="rounded-2xl border border-red-500/15 bg-red-950/15 p-4">
      <p className="mb-3 text-xs font-medium text-red-300">Batalkan request ini?</p>
      <form action={cancelPickupRequest.bind(null, pickupId)} className="flex flex-wrap items-end gap-2">
        <Select name="cancellationReason" required defaultValue="">
          <option value="" disabled>Pilih alasan pembatalan</option>
          <option value="Mendadak harus pergi">Mendadak harus pergi</option>
          <option value="Sampah sudah terbuang/terjual">Sampah sudah dibuang/terjual</option>
          <option value="Salah input data">Salah memasukkan data</option>
        </Select>
        <Button type="submit" variant="destructive" size="sm">Batalkan</Button>
      </form>
    </div>
  );
}
