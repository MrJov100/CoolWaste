import { PickupSlot, WasteType } from "@prisma/client";

import type { CollectorServiceCard, SavedAddressOption } from "@/lib/types";
import { createPickupRequest } from "@/lib/actions/dashboard";
import { PICKUP_SLOT_LABEL, WASTE_TYPE_OPTIONS } from "@/lib/constants";
import { formatCurrency, titleCase } from "@/lib/utils";
import { PickupLocationPicker } from "@/components/dashboard/pickup-location-picker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormState } from "@/components/ui/form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function MarketplaceListingsGrid({
  title,
  description,
  collectors,
  savedAddresses,
}: {
  title: string;
  description: string;
  collectors: CollectorServiceCard[];
  savedAddresses: SavedAddressOption[];
}) {
  const defaultAddress = savedAddresses.find((item) => item.isDefault) ?? savedAddresses[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
      <Card>
        <CardHeader>
          <CardDescription>Jual Sampah dalam ≤ 1 menit</CardDescription>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <FormState action={createPickupRequest} submitLabel="Request Pickup">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wasteType">Jenis sampah</Label>
                <Select id="wasteType" name="wasteType" defaultValue={WasteType.PLASTIC}>
                  {WASTE_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type.toUpperCase()}>
                      {titleCase(type)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedWeightKg">Estimasi berat (kg)</Label>
                <Input id="estimatedWeightKg" name="estimatedWeightKg" type="number" min="0.5" step="0.1" placeholder="3" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Foto sampah</Label>
              <Input id="photo" name="photo" type="file" accept="image/*" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addressId">Alamat tersimpan</Label>
                <Select id="addressId" name="addressId" defaultValue={defaultAddress?.id ?? ""}>
                  <option value="">Tulis alamat manual</option>
                  {savedAddresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label} - {address.address}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupSlot">Slot waktu</Label>
                <Select id="pickupSlot" name="pickupSlot" defaultValue={PickupSlot.PAGI}>
                  {Object.entries(PICKUP_SLOT_LABEL).map(([slot, label]) => (
                    <option key={slot} value={slot}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <PickupLocationPicker
              title="Titik lokasi pickup"
              description="Gunakan titik Google Maps dari alamat default, lalu geser sesuai posisi pickup yang diinginkan."
              addressName="addressText"
              addressLabel="Lokasi pickup"
              initialLatitude={defaultAddress?.latitude}
              initialLongitude={defaultAddress?.longitude}
              initialAddress={defaultAddress?.address}
            />

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea id="notes" name="notes" placeholder="Contoh: sudah dipilah, bisa diambil di teras depan." />
            </div>
          </FormState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>{description}</CardDescription>
          <CardTitle>Collector siap matching</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {collectors.length ? (
            collectors.map((collector) => (
              <div key={collector.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="emerald">Verified</Badge>
                      <span className="text-xs text-slate-400">{collector.serviceAreaLabel}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">{collector.collectorName}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Radius {collector.serviceRadiusKm.toFixed(0)} km · kapasitas sisa {collector.remainingCapacityKg.toFixed(1)} kg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">harga mengikuti kategori yang dipilih</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {collector.acceptedWasteTypes.map((type) => (
                    <Badge key={type} variant="slate">
                      {titleCase(type)}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {collector.acceptedWasteTypes.map((type) => (
                    <div key={type} className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-300">
                      {titleCase(type)}: {formatCurrency(collector.wastePricing[type])}/kg
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">Belum ada collector terverifikasi yang siap matching.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
