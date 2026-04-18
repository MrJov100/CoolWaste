import type { ReactNode, ElementType } from "react";
import Link from "next/link";
import { VerificationState, WasteType } from "@prisma/client";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Phone,
  Plus,
  Scale,
  Shield,
  Star,
  Trash2,
  User,
} from "lucide-react";

import { PickupLocationPicker } from "@/components/dashboard/pickup-location-picker";
import {
  addSavedAddress,
  deleteSavedAddress,
  deleteUserAccount,
  setDefaultSavedAddress,
  updateCollectorSettings,
  updateUserSettings,
} from "@/lib/actions/settings";
import { WASTE_TYPE_OPTIONS, normalizeWastePricingMap } from "@/lib/constants";
import { requireProfile } from "@/lib/auth";
import { getSettingsData } from "@/lib/data/settings";
import { titleCase } from "@/lib/utils";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { FormState } from "@/components/ui/form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SettingsData = Awaited<ReturnType<typeof getSettingsData>>;

const WASTE_ICONS: Record<string, string> = {
  plastic: "🧴",
  paper: "📄",
  organic: "🌿",
  metal: "🔩",
  glass: "🫙",
};

export default async function SettingsPage() {
  const profile = await requireProfile();
  const settings = await getSettingsData(profile.id);

  return (
    <div className="min-h-screen bg-slate-950">
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

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-8 sm:px-6">
        {/* Header */}
        <section className="mb-8 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-slate-400 transition-all hover:border-white/20 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Pengaturan Akun
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Kelola profil, alamat, dan preferensi akunmu
            </p>
          </div>
        </section>

        {profile.role === "USER" ? <UserSettings settings={settings} /> : null}
        {profile.role === "COLLECTOR" ? <CollectorSettings settings={settings} /> : null}
      </main>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ElementType;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
          <Icon className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="font-semibold text-white">{title}</h2>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function UserSettings({ settings }: { settings: SettingsData }) {
  const addresses = (settings.profile as { savedAddresses?: Array<{ id: string; label: string; address: string; isDefault: boolean }> }).savedAddresses ?? [];

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <SectionCard icon={User} title="Informasi Profil" description="Nama dan nomor telepon yang digunakan">
        <FormState action={updateUserSettings} submitLabel="Simpan Perubahan" resetOnSuccess={false}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1.5 text-sm text-slate-300">
                <User className="h-3.5 w-3.5 text-slate-500" /> Nama lengkap
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={settings.profile.name}
                className="rounded-2xl"
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm text-slate-300">
                <Phone className="h-3.5 w-3.5 text-slate-500" /> Nomor telepon
              </Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={settings.profile.phone ?? ""}
                className="rounded-2xl"
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>
          <PickupLocationPicker
            title="Lokasi utama"
            description="Titik lokasi default untuk pickup request"
            addressName="address"
            addressLabel="Alamat utama"
            initialLatitude={settings.profile.latitude}
            initialLongitude={settings.profile.longitude}
            initialAddress={settings.profile.address}
          />
        </FormState>
      </SectionCard>

      {/* Saved addresses */}
      <SectionCard icon={MapPin} title="Alamat Tersimpan" description="Kelola alamat pickup yang sering digunakan">
        {addresses.length > 0 && (
          <div className="mb-4 space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-sm font-medium text-white">{address.label}</span>
                    {address.isDefault && <Badge variant="emerald">Default</Badge>}
                  </div>
                  <p className="mt-1 pl-5 text-xs text-slate-400 line-clamp-2">{address.address}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {!address.isDefault ? (
                    <form action={setDefaultSavedAddress.bind(null, address.id)}>
                      <button
                        type="submit"
                        className="flex items-center gap-1 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-slate-400 hover:border-white/20 hover:text-slate-200"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Default
                      </button>
                    </form>
                  ) : null}
                  {!address.isDefault || addresses.length > 1 ? (
                    <form action={deleteSavedAddress.bind(null, address.id)}>
                      <button
                        type="submit"
                        className="flex items-center gap-1 rounded-xl border border-red-500/20 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm text-slate-400 hover:border-white/20 hover:text-slate-200">
            <Plus className="h-4 w-4" /> Tambah alamat baru
          </summary>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <FormState action={addSavedAddress} submitLabel="Tambah Alamat" resetOnSuccess={true}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="label" className="text-sm text-slate-300">Label alamat</Label>
                  <Input id="label" name="label" placeholder="Rumah, Kantor, dll." className="rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Jadikan default?</Label>
                  <label className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-white/10 px-3 text-sm text-slate-300">
                    <input name="isDefault" type="checkbox" className="h-4 w-4 rounded" />
                    Pakai sebagai alamat utama
                  </label>
                </div>
              </div>
              <PickupLocationPicker
                title="Titik alamat"
                description="Pilih titik lokasi di peta"
                addressName="address"
                addressLabel="Alamat"
              />
            </FormState>
          </div>
        </details>
      </SectionCard>

      {/* Danger zone */}
      <div className="rounded-3xl border border-red-500/20 bg-red-950/10 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 className="font-semibold text-red-300">Zona Berbahaya</h2>
            <p className="text-xs text-red-400/70">Tindakan di bawah tidak dapat dibatalkan</p>
          </div>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Menghapus akun akan menghapus profil, alamat tersimpan, dan semua data yang terkait. Pickup yang sudah selesai tetap tersimpan untuk keperluan audit.
        </p>
        <form action={deleteUserAccount}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-2.5 text-sm font-medium text-red-300 transition-all hover:bg-red-950/60 hover:text-red-200"
            onClick={(e) => {
              if (!confirm("Yakin hapus akun? Tindakan ini tidak bisa dibatalkan.")) {
                e.preventDefault();
              }
            }}
          >
            <Trash2 className="h-4 w-4" /> Hapus Akun Saya
          </button>
        </form>
      </div>
    </div>
  );
}

function CollectorSettings({ settings }: { settings: SettingsData }) {
  const wastePricing = normalizeWastePricingMap(settings.profile.wastePricing);
  const isVerified = settings.profile.verificationState === VerificationState.VERIFIED;

  return (
    <div className="space-y-6">
      {/* Status card */}
      <div className={`rounded-3xl border p-5 ${isVerified ? "border-emerald-500/20 bg-emerald-950/10" : "border-amber-500/20 bg-amber-950/10"}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isVerified ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
            <Shield className={`h-5 w-5 ${isVerified ? "text-emerald-400" : "text-amber-400"}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {isVerified ? "✅ Akun Verified" : "⏳ Menunggu Verifikasi Admin"}
            </p>
            <p className="text-xs text-slate-400">
              {isVerified
                ? "Kamu aktif menerima matching pickup otomatis"
                : "Pickup matching akan aktif setelah admin memverifikasi"}
            </p>
          </div>
        </div>
      </div>

      {/* Collector form */}
      <SectionCard icon={User} title="Pengaturan Collector" description="Informasi operasional layanan pickup">
        <FormState action={updateCollectorSettings} submitLabel="Simpan Pengaturan" resetOnSuccess={false}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="collector-name" className="text-sm text-slate-300">Nama collector</Label>
              <Input id="collector-name" name="name" defaultValue={settings.profile.name} className="rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collector-phone" className="text-sm text-slate-300">Nomor telepon</Label>
              <Input id="collector-phone" name="phone" defaultValue={settings.profile.phone ?? ""} className="rounded-2xl" />
            </div>
          </div>

          <PickupLocationPicker
            title="Lokasi basis collector"
            description="Titik gudang atau pusat operasional"
            addressName="address"
            addressLabel="Alamat basis"
            initialLatitude={settings.profile.latitude}
            initialLongitude={settings.profile.longitude}
            initialAddress={settings.profile.address}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="serviceAreaLabel" className="text-sm text-slate-300">Area layanan</Label>
              <Input id="serviceAreaLabel" name="serviceAreaLabel" defaultValue={settings.profile.serviceAreaLabel ?? ""} className="rounded-2xl" placeholder="Kec. Menteng, Jakarta" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceRadiusKm" className="text-sm text-slate-300">Radius layanan (km)</Label>
              <Input id="serviceRadiusKm" name="serviceRadiusKm" type="number" min="1" step="1" defaultValue={settings.profile.serviceRadiusKm ?? ""} className="rounded-2xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyCapacityKg" className="flex items-center gap-1.5 text-sm text-slate-300">
              <Scale className="h-3.5 w-3.5 text-slate-500" /> Kapasitas harian (kg)
            </Label>
            <Input id="dailyCapacityKg" name="dailyCapacityKg" type="number" min="1" step="1" defaultValue={settings.profile.dailyCapacityKg ?? ""} className="rounded-2xl" />
          </div>

          <div className="space-y-3">
            <Label className="text-sm text-slate-300">Jenis sampah yang diterima</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {WASTE_TYPE_OPTIONS.map((type) => {
                const key = type.toLowerCase();
                const isChecked = settings.profile.acceptedWasteTypes?.includes(type.toUpperCase() as WasteType);
                return (
                  <label
                    key={type}
                    className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-white/10 p-3 text-xs transition-all has-[:checked]:border-emerald-500/40 has-[:checked]:bg-emerald-500/10"
                  >
                    <input
                      type="checkbox"
                      name="acceptedWasteTypes"
                      value={type.toUpperCase()}
                      defaultChecked={isChecked}
                      className="sr-only"
                    />
                    <span className="text-xl">{WASTE_ICONS[key]}</span>
                    <span className="text-slate-300">{titleCase(type)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-1.5 text-sm text-slate-300">
              <Star className="h-3.5 w-3.5 text-slate-500" /> Harga per kategori (Rp/kg)
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { name: "plasticPrice", label: "Plastic", key: "PLASTIC" },
                { name: "paperPrice", label: "Paper", key: "PAPER" },
                { name: "organicPrice", label: "Organic", key: "ORGANIC" },
                { name: "metalPrice", label: "Metal", key: "METAL" },
                { name: "glassPrice", label: "Glass", key: "GLASS" },
              ].map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <Label htmlFor={item.name} className="text-xs text-slate-400">
                    {WASTE_ICONS[item.label.toLowerCase()]} {item.label}
                  </Label>
                  <Input
                    id={item.name}
                    name={item.name}
                    type="number"
                    min="100"
                    step="100"
                    defaultValue={wastePricing[item.key as keyof typeof wastePricing]}
                    className="rounded-2xl"
                  />
                </div>
              ))}
            </div>
          </div>
        </FormState>
      </SectionCard>
    </div>
  );
}
