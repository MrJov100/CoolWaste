import Image from "next/image";
import Link from "next/link";
import { PaymentMethod, PickupStatus } from "@prisma/client";
import { format } from "date-fns";
import { ExternalLink, Route } from "lucide-react";

import type { PickupRequestCard } from "@/lib/types";
import { completePickupRequest, submitRating, cancelPickupRequest } from "@/lib/actions/dashboard";
import { buildGoogleMapsDirectionsUrl } from "@/lib/maps";
import { PICKUP_SLOT_LABEL, PICKUP_STATUS_LABEL } from "@/lib/constants";
import { formatDistanceMeters, formatDurationSeconds } from "@/lib/routing";
import { formatCurrency, titleCase } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const statusVariant = {
  MENUNGGU_MATCHING: "amber",
  TERJADWAL: "emerald",
  DALAM_PERJALANAN: "emerald",
  SELESAI: "emerald",
  DIBATALKAN: "slate",
} as const;

export function MarketplaceOfferList({
  title,
  description,
  offers,
  mode = "viewer",
  hidePendingCommercials = false,
}: {
  title: string;
  description: string;
  offers: PickupRequestCard[];
  mode?: "viewer" | "collector";
  hidePendingCommercials?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {offers.length ? (
          offers.map((offer) => (
            <div key={offer.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              {(() => {
                const shouldHideCommercials = hidePendingCommercials && offer.status === PickupStatus.MENUNGGU_MATCHING;
                const displayAmount = shouldHideCommercials ? null : (offer.finalTotalAmount ?? offer.estimatedTotalAmount);
                const displayPrice = shouldHideCommercials ? null : offer.pricePerKgSnapshot;

                return (
              <div className="flex flex-col gap-4 lg:flex-row">
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-slate-900">
                  {offer.photoUrl ? (
                    <Image src={offer.photoUrl} alt={offer.wasteType} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-500">No photo</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant={statusVariant[offer.status]}>{PICKUP_STATUS_LABEL[offer.status]}</Badge>
                        <span className="text-xs text-slate-400">{offer.requestNo}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        {titleCase(offer.wasteType)} {offer.estimatedWeightKg.toFixed(1)} kg
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {offer.userName}
                        {offer.collectorName ? ` ke ${offer.collectorName}` : ""}
                        {` · ${offer.areaLabel}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {displayAmount != null ? (
                        <p className="text-lg font-semibold text-emerald-300">{formatCurrency(displayAmount)}</p>
                      ) : (
                        <p className="text-sm font-medium text-amber-200">Harga muncul setelah collector menerima</p>
                      )}
                      <p className="text-xs text-slate-500">{format(offer.createdAt, "dd MMM yyyy, HH:mm")}</p>
                    </div>
                  </div>

                  {offer.notes ? <p className="mt-3 text-sm leading-7 text-slate-300">{offer.notes}</p> : null}
                  {offer.collectorNote ? (
                    <p className="mt-2 text-sm text-emerald-200">Catatan collector: {offer.collectorNote}</p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
                    {displayPrice != null ? <span>{formatCurrency(displayPrice)}/kg</span> : null}
                    <span>{PICKUP_SLOT_LABEL[offer.pickupSlot]}</span>
                    {offer.scheduledAt ? <span>Jadwal {format(offer.scheduledAt, "dd MMM yyyy, HH:mm")}</span> : null}
                    <span>{offer.addressText}</span>
                    <Link href={`/pickups/${offer.id}`} className="text-emerald-300 hover:text-emerald-200">
                      Lihat detail
                    </Link>
                    {offer.collectorName ? (
                      <Link href={`/pickups/${offer.id}#pickup-chat`} className="text-amber-300 hover:text-amber-200">
                        Buka chat
                      </Link>
                    ) : null}
                  </div>

                  <RouteSummary
                    offer={offer}
                    showNavigation={mode === "collector"}
                    hidden={shouldHideCommercials}
                  />

                  {mode === "collector" ? <CollectorActions offer={offer} /> : null}

                  {mode !== "collector" && offer.status === "SELESAI" && !offer.hasUserRated ? (
                    <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                      <p className="mb-3 text-sm font-medium text-emerald-200">Bagaimana pelayanan collector?</p>
                      <form action={submitRating.bind(null, offer.id)} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                        <Select name="score" required defaultValue="5">
                          <option value="5">⭐⭐⭐⭐⭐ Bagus Sekali</option>
                          <option value="4">⭐⭐⭐⭐ Bagus</option>
                          <option value="3">⭐⭐⭐ Biasa Saja</option>
                          <option value="2">⭐⭐ Kurang</option>
                          <option value="1">⭐ Sangat Buruk</option>
                        </Select>
                        <Input name="comment" placeholder="Komentar (opsional)..." />
                        <Button type="submit" size="sm" variant="secondary">Kirim Rating</Button>
                      </form>
                    </div>
                  ) : null}

                  {mode !== "collector" && (offer.status === "MENUNGGU_MATCHING" || offer.status === "TERJADWAL") ? (
                    <div className="mt-4 rounded-3xl border border-white/10 bg-red-950/10 p-4">
                      <form action={cancelPickupRequest.bind(null, offer.id)} className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-red-200">Batal Request:</span>
                        <Select name="cancellationReason" required defaultValue="">
                          <option value="" disabled>Pilih Alasan Batal</option>
                          <option value="Mendadak harus pergi">Mendadak harus pergi</option>
                          <option value="Sampah sudah terbuang/terjual">Sampah sudah dibuang/terjual</option>
                          <option value="Salah input data">Salah memasukkan data</option>
                        </Select>
                        <Button type="submit" variant="destructive" size="sm">Batalkan</Button>
                      </form>
                    </div>
                  ) : null}

                  {offer.status === "DIBATALKAN" && offer.cancellationReason ? (
                    <p className="mt-3 rounded-xl bg-red-950/40 p-3 text-sm text-red-300">
                      Dibatalkan karena: {offer.cancellationReason}
                    </p>
                  ) : null}
                </div>
              </div>
                );
              })()}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">Belum ada pickup untuk ditampilkan.</p>
        )}
      </CardContent>
    </Card>
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
  if (hidden) {
    return null;
  }

  const formattedDistance = formatDistanceMeters(offer.routeDistanceMeters);
  const formattedDuration = formatDurationSeconds(offer.routeDurationSeconds);
  const directionsUrl = buildGoogleMapsDirectionsUrl({
    originLatitude: offer.collectorLatitude,
    originLongitude: offer.collectorLongitude,
    destinationLatitude: offer.latitude,
    destinationLongitude: offer.longitude,
  });

  if (!formattedDistance && !formattedDuration && !directionsUrl) {
    return null;
  }

  return (
    <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-white">
            <Route className="h-4 w-4 text-emerald-300" />
            Rute collector ke pickup
          </p>
          <p className="text-sm text-slate-300">
            {formattedDistance ?? "Jarak belum tersedia"}
            {formattedDuration ? ` • ${formattedDuration}` : ""}
          </p>
          {offer.routeProvider ? (
            <p className="text-xs text-slate-500">
              Sumber rute: {offer.routeProvider === "openrouteservice" ? "openrouteservice" : "fallback Haversine"}
            </p>
          ) : null}
        </div>
        {showNavigation && directionsUrl ? (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Buka di Google Maps
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function CollectorActions({ offer }: { offer: PickupRequestCard }) {
  if (offer.status === PickupStatus.SELESAI || offer.status === PickupStatus.DIBATALKAN) {
    return null;
  }

  if (offer.status === PickupStatus.MENUNGGU_MATCHING) {
    return (
      <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
        Pickup ini masih menunggu keputusan batch collector. Setelah batch diterima, status akan berubah menjadi terjadwal.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
      <form action={completePickupRequest.bind(null, offer.id)} className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`actualWeightKg-${offer.id}`}>Berat aktual (kg)</Label>
          <Input id={`actualWeightKg-${offer.id}`} name="actualWeightKg" type="number" min="0.1" step="0.1" placeholder="3.2" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`paymentMethod-${offer.id}`}>Pembayaran</Label>
          <Select id={`paymentMethod-${offer.id}`} name="paymentMethod" defaultValue={PaymentMethod.CASH}>
            <option value={PaymentMethod.CASH}>Cash</option>
            <option value={PaymentMethod.EWALLET}>E-Wallet</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`collectorNote-${offer.id}`}>Catatan collector</Label>
          <Input id={`collectorNote-${offer.id}`} name="collectorNote" placeholder="Timbang di lokasi, user setuju." />
        </div>
        <div className="lg:col-span-3">
          <Button type="submit">Selesai & Dibayar</Button>
        </div>
      </form>
    </div>
  );
}
