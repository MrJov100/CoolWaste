"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { PaymentMethod } from "@prisma/client";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  MapPin,
  Package,
  Scale,
  Truck,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";

import type { CollectorBatchCard } from "@/lib/types";
import {
  acceptPickupBatchWithSchedule,
  rejectPickupBatchWithReason,
  startPickupBatch,
  abortPickupBatch,
  completePickupRequest,
} from "@/lib/actions/dashboard";
import { BATCH_STATUS_LABEL, PICKUP_SLOT_LABEL } from "@/lib/constants";
import { COLLECTOR_REJECTION_REASONS } from "@/lib/pickup-alerts";
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
  MENUNGGU_KONFIRMASI: {
    variant: "amber" as const,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    icon: Clock,
  },
  TERJADWAL: {
    variant: "emerald" as const,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: CalendarClock,
  },
  DALAM_PERJALANAN: {
    variant: "emerald" as const,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: Truck,
  },
  SELESAI: {
    variant: "emerald" as const,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle2,
  },
  DITOLAK: {
    variant: "slate" as const,
    color: "text-slate-500",
    bg: "bg-slate-500/10 border-slate-500/20",
    icon: X,
  },
} as const;

export function CollectorListingForm({ batches }: { batches: CollectorBatchCard[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-sm">
      <div className="border-b border-white/[0.07] px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Batch Pickup</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Daftar Pickup Per Rute</h2>
        <p className="mt-0.5 text-sm text-slate-400">
          Konfirmasi batch, atur jadwal, lalu mulai perjalanan dan selesaikan setiap titik.
        </p>
      </div>

      <div className="space-y-6 p-6">
        {batches.length ? (
          batches.map((batch) => <BatchCard key={batch.id} batch={batch} />)
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/10 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
              <Package className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">Belum ada batch pickup masuk</p>
            <p className="text-xs text-slate-600">Sistem akan matching pickup otomatis ke area layananmu</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BatchCard({ batch }: { batch: CollectorBatchCard }) {
  const cfg = statusConfig[batch.status];
  const StatusIcon = cfg.icon;
  const [abortOpen, setAbortOpen] = useState(false);

  const activeRequests = batch.requests.filter(
    (r) => r.status === "DALAM_PERJALANAN" || r.status === "TERJADWAL",
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
      {/* Batch header bar */}
      <div className={`flex items-center gap-3 border-b border-white/5 px-5 py-3 ${cfg.bg}`}>
        <StatusIcon className={`h-4 w-4 ${cfg.color}`} />
        <span className={`text-sm font-semibold ${cfg.color}`}>{BATCH_STATUS_LABEL[batch.status]}</span>
        <span className="ml-auto text-xs text-slate-500">{batch.collectorName}</span>
      </div>

      <div className="p-5">
        {/* Batch summary */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">{batch.serviceAreaLabel}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                {PICKUP_SLOT_LABEL[batch.pickupSlot]}
              </span>
              {batch.scheduledFor && (
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                  {format(batch.scheduledFor, "dd MMM yyyy, HH:mm")}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-4 text-right text-sm">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
              <p className="text-xs text-slate-500">Total Berat</p>
              <p className="mt-0.5 text-base font-semibold text-white">
                {batch.totalEstimatedWeight.toFixed(1)} kg
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
              <p className="text-xs text-slate-500">Titik Lokasi</p>
              <p className="mt-0.5 text-base font-semibold text-white">{batch.totalStops} titik</p>
            </div>
          </div>
        </div>

        {/* Per-stop detail cards */}
        <div className="mb-5 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Detail Setiap Titik</p>
          {batch.requests.map((request, idx) => {
            const wasteIcon = WASTE_ICONS[request.wasteType] ?? "♻️";
            const amount = request.finalTotalAmount ?? request.estimatedTotalAmount;
            const isActive = request.status === "DALAM_PERJALANAN";
            return (
              <div
                key={request.id}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/40"
              >
                {/* Stop header */}
                <div className="flex items-center gap-2.5 border-b border-white/[0.05] bg-white/[0.02] px-4 py-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                    {idx + 1}
                  </div>
                  <span className="text-xs font-semibold text-slate-300">{request.requestNo}</span>
                  <Badge variant="amber" className="ml-auto text-xs">{request.status}</Badge>
                  {/* Detail pickup link */}
                  <Link
                    href={`/pickups/${request.id}`}
                    className="ml-2 flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-400 transition-all hover:border-white/20 hover:text-slate-200"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Detail
                  </Link>
                </div>

                <div className="flex gap-4 p-4">
                  {/* Foto sampah */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-900">
                    {request.photoUrl ? (
                      <Image src={request.photoUrl} alt={request.wasteType} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">{wasteIcon}</div>
                    )}
                  </div>

                  {/* Detail info */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span className="text-sm font-semibold text-white">{request.userName}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span className="text-xs leading-relaxed text-slate-400">{request.addressText}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {PICKUP_SLOT_LABEL[request.pickupSlot]}
                        {request.scheduledAt && (
                          <span className="ml-1 text-slate-500">
                            · {format(request.scheduledAt, "dd MMM, HH:mm")}
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Scale className="h-3 w-3 text-slate-500" />
                        {request.estimatedWeightKg.toFixed(1)} kg
                        {request.actualWeightKg && (
                          <span className="ml-1 text-emerald-400">
                            → {request.actualWeightKg.toFixed(1)} kg aktual
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet className="h-3 w-3 text-slate-500" />
                        <span className="font-medium text-emerald-300">{formatCurrency(amount)}</span>
                        <span className="text-slate-600">
                          ({wasteIcon} {titleCase(request.wasteType)})
                        </span>
                      </span>
                    </div>
                    {request.notes && (
                      <p className="rounded-xl bg-slate-800/60 px-3 py-1.5 text-xs text-slate-400">
                        {request.notes}
                      </p>
                    )}

                    {/* Inline complete form — hanya muncul jika pickup DALAM_PERJALANAN */}
                    {isActive && (
                      <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3">
                        <p className="mb-2 text-xs font-semibold text-emerald-300">Selesaikan Pickup Ini</p>
                        <form
                          action={completePickupRequest.bind(null, request.id)}
                          className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                        >
                          <div className="space-y-1">
                            <Label htmlFor={`w-${request.id}`} className="text-xs">Berat aktual (kg)</Label>
                            <Input
                              id={`w-${request.id}`}
                              name="actualWeightKg"
                              type="number"
                              min="0.1"
                              step="0.1"
                              placeholder="3.2"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`pay-${request.id}`} className="text-xs">Pembayaran</Label>
                            <Select
                              id={`pay-${request.id}`}
                              name="paymentMethod"
                              defaultValue={PaymentMethod.CASH}
                            >
                              <option value={PaymentMethod.CASH}>Cash</option>
                              <option value={PaymentMethod.EWALLET}>E-Wallet</option>
                            </Select>
                          </div>
                          <div className="flex items-end">
                            <Button type="submit" size="sm" className="w-full sm:w-auto">
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              Selesai
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Action forms ── */}

        {batch.status === "MENUNGGU_KONFIRMASI" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <form
              action={acceptPickupBatchWithSchedule.bind(null, batch.id)}
              className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4"
            >
              <p className="mb-3 text-sm font-semibold text-emerald-200">Terima batch & atur jadwal</p>
              <div className="flex flex-col gap-3">
                <Input name="scheduledAt" type="datetime-local" required />
                <Button type="submit">Terima Batch</Button>
              </div>
            </form>
            <form
              action={rejectPickupBatchWithReason.bind(null, batch.id)}
              className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4"
            >
              <p className="mb-3 text-sm font-semibold text-red-200">Tolak batch</p>
              <div className="flex flex-col gap-3">
                <Select name="rejectionReason" required defaultValue="">
                  <option value="" disabled>Pilih alasan penolakan</option>
                  {COLLECTOR_REJECTION_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </Select>
                <Button type="submit" variant="outline">Tolak Batch</Button>
              </div>
            </form>
          </div>
        )}

        {batch.status === "TERJADWAL" && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <form action={startPickupBatch.bind(null, batch.id)}>
              <Button type="submit" className="gap-2">
                <Truck className="h-4 w-4" />
                Mulai Rute Perjalanan
              </Button>
            </form>
            <p className="text-xs text-slate-500">
              Tombol selesaikan pickup muncul di setiap titik setelah rute dimulai.
            </p>
          </div>
        )}

        {/* Batalkan Rute — collapsible */}
        {(batch.status === "TERJADWAL" || batch.status === "DALAM_PERJALANAN") && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setAbortOpen((v) => !v)}
              className="flex w-full items-center gap-2 rounded-2xl border border-red-500/15 bg-red-950/10 px-4 py-2.5 text-left text-sm text-red-400/70 transition-all hover:border-red-500/30 hover:text-red-300"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-xs font-medium">Batalkan Rute Ini</span>
              {abortOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0" />
              )}
            </button>

            {abortOpen && (
              <div className="mt-2 rounded-2xl border border-red-500/20 bg-red-950/20 p-4">
                <p className="mb-3 text-xs text-red-200/70">
                  Semua request dalam rute ini akan dilempar ke collector lain secara otomatis.
                </p>
                <form
                  action={abortPickupBatch.bind(null, batch.id)}
                  className="flex flex-wrap items-center gap-3"
                >
                  <Select name="cancellationReason" required defaultValue="">
                    <option value="" disabled>Pilih Alasan</option>
                    <option value="Kendaraan Rusak / Kendala Teknis">Kendaraan Rusak / Teknis</option>
                    <option value="Area Banjir / Akses Tertutup">Akses Tertutup / Banjir</option>
                    <option value="Kapasitas Angkut Penuh Mendadak">Kapasitas Mendadak Penuh</option>
                  </Select>
                  <Button type="submit" variant="destructive" size="sm">Batalkan Rute</Button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
