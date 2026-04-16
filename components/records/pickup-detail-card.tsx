import Image from "next/image";
import { format } from "date-fns";
import { CalendarClock, ExternalLink, Leaf, Route, UserRound } from "lucide-react";

import { PICKUP_SLOT_LABEL, PICKUP_STATUS_LABEL } from "@/lib/constants";
import { buildGoogleMapsDirectionsUrl } from "@/lib/maps";
import { formatDistanceMeters, formatDurationSeconds } from "@/lib/routing";
import type { PickupDetailData } from "@/lib/types";
import { formatCurrency, titleCase } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const statusVariant = {
  MENUNGGU_MATCHING: "amber",
  TERJADWAL: "emerald",
  DALAM_PERJALANAN: "emerald",
  SELESAI: "emerald",
  DIBATALKAN: "slate",
} as const;

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

  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <Card>
        <CardHeader>
          <CardDescription>Pickup overview</CardDescription>
          <CardTitle>{pickup.requestNo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[pickup.status]}>{PICKUP_STATUS_LABEL[pickup.status]}</Badge>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            <p className="inline-flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-300" />
              {titleCase(pickup.wasteType)} · estimasi {pickup.estimatedWeightKg.toFixed(1)} kg
            </p>
            <p className="inline-flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-emerald-300" />
              Dibuat {format(pickup.createdAt, "dd MMM yyyy, HH:mm")}
            </p>
            <p className="inline-flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-emerald-300" />
              Slot {PICKUP_SLOT_LABEL[pickup.pickupSlot]}
            </p>
            {pickup.scheduledAt ? (
              <p className="inline-flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-emerald-300" />
                Jadwal pickup {format(pickup.scheduledAt, "dd MMM yyyy, HH:mm")}
              </p>
            ) : null}
            <p className="inline-flex items-center gap-2">
              <UserRound className="h-4 w-4 text-emerald-300" />
              User: {pickup.userName} · {pickup.userEmail}
            </p>
            <p className="inline-flex items-center gap-2">
              <UserRound className="h-4 w-4 text-emerald-300" />
              Collector: {pickup.collectorName ?? "Belum ditetapkan"}
              {pickup.collectorEmail ? ` · ${pickup.collectorEmail}` : ""}
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-400">Harga snapshot</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {shouldHideCommercials ? "Menunggu collector menerima" : formatCurrency(pickup.pricePerKgSnapshot)}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-400">Estimasi nilai</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {shouldHideCommercials ? "Akan tampil setelah collector menerima" : formatCurrency(pickup.estimatedTotalAmount)}
              </p>
            </div>
            {pickup.finalTotalAmount ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-400">Nilai final</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(pickup.finalTotalAmount)}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-slate-400">Lokasi pickup</p>
            <p className="mt-2 text-lg font-semibold text-white">{pickup.areaLabel}</p>
            <p className="mt-2 text-sm text-slate-300">{pickup.addressText}</p>
            {pickup.actualWeightKg ? (
              <p className="mt-2 text-sm text-slate-400">Berat aktual: {pickup.actualWeightKg.toFixed(1)} kg</p>
            ) : null}
          </div>

          {!shouldHideCommercials && (formattedDistance || formattedDuration || (canNavigate && directionsUrl)) ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="inline-flex items-center gap-2 text-sm text-slate-400">
                <Route className="h-4 w-4 text-emerald-300" />
                Rute collector ke pickup
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formattedDistance ?? "Belum dihitung"}
                {formattedDuration ? ` • ${formattedDuration}` : ""}
              </p>
              {pickup.routeProvider ? (
                <p className="mt-2 text-sm text-slate-400">
                  Dihitung via {pickup.routeProvider === "openrouteservice" ? "openrouteservice" : "fallback Haversine"}.
                </p>
              ) : null}
              {canNavigate && directionsUrl ? (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-4`}
                >
                  Buka di Google Maps
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Pickup evidence</CardDescription>
          <CardTitle>Foto dan catatan pickup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative h-72 overflow-hidden rounded-3xl bg-slate-950">
            {pickup.photoUrl ? (
              <Image src={pickup.photoUrl} alt={pickup.wasteType} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Belum ada foto sampah</div>
            )}
          </div>
          {pickup.notes ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-400">Catatan user</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">{pickup.notes}</p>
            </div>
          ) : null}
          {pickup.collectorNote ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-400">Catatan collector</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">{pickup.collectorNote}</p>
            </div>
          ) : null}
          {pickup.completedAt ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-400">Diselesaikan pada</p>
              <p className="mt-2 text-sm text-slate-300">{format(pickup.completedAt, "dd MMM yyyy, HH:mm")}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
