import type { CollectorBatchCard } from "@/lib/types";
import { acceptPickupBatchWithSchedule, rejectPickupBatchWithReason, startPickupBatch, abortPickupBatch } from "@/lib/actions/dashboard";
import { BATCH_STATUS_LABEL, PICKUP_SLOT_LABEL } from "@/lib/constants";
import { COLLECTOR_REJECTION_REASONS } from "@/lib/pickup-alerts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const statusVariant = {
  MENUNGGU_KONFIRMASI: "amber",
  TERJADWAL: "emerald",
  DALAM_PERJALANAN: "emerald",
  SELESAI: "emerald",
  DITOLAK: "slate",
} as const;

export function CollectorListingForm({ batches }: { batches: CollectorBatchCard[] }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Batch pickup collector</CardDescription>
        <CardTitle>Daftar pickup per rute</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {batches.length ? (
          batches.map((batch) => (
            <div key={batch.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant={statusVariant[batch.status]}>{BATCH_STATUS_LABEL[batch.status]}</Badge>
                    <span className="text-xs text-slate-400">{batch.collectorName}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{batch.serviceAreaLabel}</h3>
                  <p className="mt-1 text-sm text-slate-400">{PICKUP_SLOT_LABEL[batch.pickupSlot]}</p>
                </div>
                <div className="text-right text-sm text-slate-300">
                  <p>Total {batch.totalEstimatedWeight.toFixed(1)} kg</p>
                  <p>{batch.totalStops} lokasi</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                {batch.requests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                    <p className="font-medium text-white">{request.userName}</p>
                    <p>{request.addressText}</p>
                    <p>
                      {request.wasteType} · {request.estimatedWeightKg.toFixed(1)} kg
                    </p>
                  </div>
                ))}
              </div>

              {batch.status === "MENUNGGU_KONFIRMASI" ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <form action={acceptPickupBatchWithSchedule.bind(null, batch.id)} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="mb-3 text-sm font-medium text-white">Terima batch dan atur jadwal pickup</p>
                    <div className="flex flex-col gap-3">
                      <Input
                        name="scheduledAt"
                        type="datetime-local"
                        required
                      />
                      <Button type="submit">Terima batch</Button>
                    </div>
                  </form>
                  <form action={rejectPickupBatchWithReason.bind(null, batch.id)} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="mb-3 text-sm font-medium text-white">Tolak batch dengan alasan</p>
                    <div className="flex flex-col gap-3">
                      <Select name="rejectionReason" required defaultValue="">
                        <option value="" disabled>Pilih alasan penolakan</option>
                        {COLLECTOR_REJECTION_REASONS.map((reason) => (
                          <option key={reason} value={reason}>{reason}</option>
                        ))}
                      </Select>
                      <Button type="submit" variant="outline">
                        Tolak
                      </Button>
                    </div>
                  </form>
                </div>
              ) : null}

              {batch.status === "TERJADWAL" ? (
                <div className="mt-4">
                  <form action={startPickupBatch.bind(null, batch.id)}>
                    <Button type="submit">Mulai rute</Button>
                  </form>
                </div>
              ) : null}

              {batch.status === "TERJADWAL" || batch.status === "DALAM_PERJALANAN" ? (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-950/20 p-4">
                  <p className="text-sm font-medium text-red-200">Batalkan/Abort Rute Ini</p>
                  <p className="text-xs text-red-200/70">
                    Semua request dalam rute ini akan dilempar ke collector lain.
                  </p>
                  <form action={abortPickupBatch.bind(null, batch.id)} className="flex flex-wrap items-center gap-3">
                    <Select name="cancellationReason" required defaultValue="">
                      <option value="" disabled>Pilih Alasan</option>
                      <option value="Kendaraan Rusak / Kendala Teknis">Kendaraan Rusak / Teknis</option>
                      <option value="Area Banjir / Akses Tertutup">Akses Tertutup / Banjir</option>
                      <option value="Kapasitas Angkut Penuh Mendadak">Kapasitas Mendadak Penuh</option>
                    </Select>
                    <Button type="submit" variant="destructive" size="sm">
                      Batalkan Rute
                    </Button>
                  </form>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">Belum ada batch pickup yang masuk untuk collector ini.</p>
        )}
      </CardContent>
    </Card>
  );
}
