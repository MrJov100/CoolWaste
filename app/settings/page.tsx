import Link from "next/link";
import { VerificationState, WasteType } from "@prisma/client";

import { PickupLocationPicker } from "@/components/dashboard/pickup-location-picker";
import {
  addSavedAddress,
  deleteSavedAddress,
  setDefaultSavedAddress,
  updateCollectorSettings,
  updateUserSettings,
} from "@/lib/actions/settings";
import { WASTE_TYPE_OPTIONS } from "@/lib/constants";
import { requireProfile } from "@/lib/auth";
import { getSettingsData } from "@/lib/data/settings";
import { titleCase } from "@/lib/utils";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormState } from "@/components/ui/form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBanner } from "@/components/ui/status-banner";
import { Textarea } from "@/components/ui/textarea";
import { normalizeWastePricingMap } from "@/lib/constants";

export default async function SettingsPage() {
  const profile = await requireProfile();
  const settings = await getSettingsData(profile.id);

  return (
    <div className="min-h-screen">
      <Topbar
        profile={{
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          saldo: profile.saldo,
          address: profile.address,
        }}
      />

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10">
        <section className="mb-6">
          <StatusBanner
            tone={profile.role === "COLLECTOR" && profile.verificationState !== VerificationState.VERIFIED ? "warning" : "info"}
            title={profile.role === "COLLECTOR" ? "Pengaturan collector" : "Pengaturan user"}
            message={
              profile.role === "COLLECTOR"
                ? "Atur area layanan, radius, kapasitas, jenis sampah, dan harga default collector di sini."
                : "Kelola profil user, alamat utama, dan beberapa alamat pickup tambahan di sini."
            }
          />
        </section>

        <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Badge variant="emerald" className="w-fit">
              {profile.role} settings
            </Badge>
            <h1 className="text-4xl font-semibold text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              Pengaturan akun Smart Waste
            </h1>
            <p className="max-w-2xl text-slate-300">
              Semua perubahan di halaman ini langsung terhubung ke profil aktif dan dipakai oleh dashboard serta flow pickup.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard">
              <Button variant="secondary">Kembali ke Dashboard</Button>
            </Link>
            <Link href="/pickups">
              <Button variant="outline">Lihat Pickup</Button>
            </Link>
          </div>
        </section>

        {profile.role === "USER" ? (
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardHeader>
                <CardDescription>Profil utama user</CardDescription>
                <CardTitle>Info akun dan alamat utama</CardTitle>
              </CardHeader>
              <CardContent>
                <FormState action={updateUserSettings} submitLabel="Simpan pengaturan user" resetOnSuccess={false}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama lengkap</Label>
                    <Input id="name" name="name" defaultValue={settings.profile.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor telepon</Label>
                    <Input id="phone" name="phone" defaultValue={settings.profile.phone ?? ""} />
                  </div>
                  <PickupLocationPicker
                    title="Lokasi utama user"
                    description="Pilih dan geser titik Google Maps untuk alamat utama user."
                    addressName="address"
                    addressLabel="Alamat utama"
                    initialLatitude={settings.profile.latitude}
                    initialLongitude={settings.profile.longitude}
                    initialAddress={settings.profile.address}
                  />
                </FormState>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardDescription>Alamat pickup tambahan</CardDescription>
                  <CardTitle>Tambah alamat user</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormState action={addSavedAddress} submitLabel="Tambah alamat" resetOnSuccess={true}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="label">Label alamat</Label>
                        <Input id="label" name="label" placeholder="Rumah orang tua" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="isDefault">Jadikan default</Label>
                        <label className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 px-3 text-sm text-slate-300">
                          <input id="isDefault" name="isDefault" type="checkbox" className="h-4 w-4" />
                          Pakai sebagai alamat utama
                        </label>
                      </div>
                    </div>
                    <PickupLocationPicker
                      title="Titik alamat tambahan"
                      description="Atur titik pickup tambahan dengan Google Maps lalu simpan sebagai alamat user."
                      addressName="address"
                      addressLabel="Alamat"
                    />
                  </FormState>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Alamat tersimpan</CardDescription>
                  <CardTitle>Manajemen alamat user</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.profile.savedAddresses.length ? (
                    settings.profile.savedAddresses.map((address) => (
                      <div key={address.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="mb-2 flex items-center gap-2">
                              {address.isDefault ? <Badge variant="emerald">Default</Badge> : null}
                              <span className="text-sm font-medium text-white">{address.label}</span>
                            </div>
                            <p className="text-sm text-slate-300">{address.address}</p>
                          </div>
                          <div className="flex gap-2">
                            {!address.isDefault ? (
                              <form action={setDefaultSavedAddress.bind(null, address.id)}>
                                <Button type="submit" variant="outline" size="sm">
                                  Jadikan default
                                </Button>
                              </form>
                            ) : null}
                            {!address.isDefault || settings.profile.savedAddresses.length > 1 ? (
                              <form action={deleteSavedAddress.bind(null, address.id)}>
                                <Button type="submit" variant="ghost" size="sm">
                                  Hapus
                                </Button>
                              </form>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Belum ada alamat tersimpan.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {profile.role === "COLLECTOR" ? (
          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <Card>
              <CardHeader>
                <CardDescription>Ringkasan operasional collector</CardDescription>
                <CardTitle>Status area layanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm text-slate-400">Status verifikasi</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {settings.profile.verificationState === VerificationState.VERIFIED ? "Verified" : "Pending admin"}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm text-slate-400">Area layanan aktif</p>
                  <p className="mt-2 text-lg font-semibold text-white">{settings.profile.serviceAreaLabel ?? "Belum diatur"}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm text-slate-400">Batch aktif</p>
                  <p className="mt-2 text-lg font-semibold text-white">{"activeBatchCount" in settings ? settings.activeBatchCount : 0}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm text-slate-400">Muatan berjalan</p>
                  <p className="mt-2 text-lg font-semibold text-white">{settings.profile.currentLoadKg.toFixed(1)} kg</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Pengaturan collector</CardDescription>
                <CardTitle>Area layanan dan preferensi operasional</CardTitle>
              </CardHeader>
              <CardContent>
                <FormState action={updateCollectorSettings} submitLabel="Simpan pengaturan collector" resetOnSuccess={false}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="collector-name">Nama collector</Label>
                      <Input id="collector-name" name="name" defaultValue={settings.profile.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="collector-phone">Nomor telepon</Label>
                      <Input id="collector-phone" name="phone" defaultValue={settings.profile.phone ?? ""} />
                    </div>
                  </div>
                  <PickupLocationPicker
                    title="Titik lokasi collector"
                    description="Atur titik basis collector dengan Google Maps. Titik ini bisa digeser sesuai gudang atau titik kumpul sebenarnya."
                    addressName="address"
                    addressLabel="Alamat basis"
                    initialLatitude={settings.profile.latitude}
                    initialLongitude={settings.profile.longitude}
                    initialAddress={settings.profile.address}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="serviceAreaLabel">Area layanan</Label>
                      <Input id="serviceAreaLabel" name="serviceAreaLabel" defaultValue={settings.profile.serviceAreaLabel ?? ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serviceRadiusKm">Radius layanan (km)</Label>
                      <Input id="serviceRadiusKm" name="serviceRadiusKm" type="number" min="1" step="1" defaultValue={settings.profile.serviceRadiusKm ?? ""} />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="dailyCapacityKg">Kapasitas harian (kg)</Label>
                      <Input id="dailyCapacityKg" name="dailyCapacityKg" type="number" min="1" step="1" defaultValue={settings.profile.dailyCapacityKg ?? ""} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis sampah diterima</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {WASTE_TYPE_OPTIONS.map((type) => (
                        <label key={type} className="flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            name="acceptedWasteTypes"
                            value={type.toUpperCase()}
                            defaultChecked={settings.profile.acceptedWasteTypes.includes(type.toUpperCase() as WasteType)}
                            className="h-4 w-4"
                          />
                          {titleCase(type)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Harga per kategori</Label>
                    {(() => {
                      const wastePricing = normalizeWastePricingMap(settings.profile.wastePricing);

                      return (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="plasticPrice">Plastic</Label>
                            <Input id="plasticPrice" name="plasticPrice" type="number" min="100" step="100" defaultValue={wastePricing.PLASTIC} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="paperPrice">Paper</Label>
                            <Input id="paperPrice" name="paperPrice" type="number" min="100" step="100" defaultValue={wastePricing.PAPER} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="organicPrice">Organic</Label>
                            <Input id="organicPrice" name="organicPrice" type="number" min="100" step="100" defaultValue={wastePricing.ORGANIC} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="metalPrice">Metal</Label>
                            <Input id="metalPrice" name="metalPrice" type="number" min="100" step="100" defaultValue={wastePricing.METAL} />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="glassPrice">Glass</Label>
                            <Input id="glassPrice" name="glassPrice" type="number" min="100" step="100" defaultValue={wastePricing.GLASS} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </FormState>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {profile.role === "ADMIN" ? (
          <Card>
            <CardHeader>
              <CardDescription>Pengaturan admin</CardDescription>
              <CardTitle>Admin memakai panel operasional</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">
                Untuk saat ini pengaturan khusus admin belum ditambahkan. Pengelolaan collector dan operasional tetap dilakukan dari dashboard admin.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
