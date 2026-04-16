"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

import { PickupLocationPicker } from "@/components/dashboard/pickup-location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ActionState = {
  success: boolean;
  message: string;
};

const initialState: ActionState = {
  success: false,
  message: "",
};

export function SignupFlow({
  action,
}: {
  action: (state: ActionState, payload: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("USER");

  const [clientError, setClientError] = useState("");
  const errorMessage = clientError || (!state.success ? state.message : "");
  const hasError = Boolean(errorMessage);

  const handleNext = () => {
    // Basic frontend validation for Step 1 before continuing
    if (!formRef.current) return;
    
    const formData = new FormData(formRef.current);
    const name = formData.get("name")?.toString() ?? "";
    const email = formData.get("email")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    if (!name || !email || !password || password.length < 6) {
      setClientError("Harap lengkapi Nama, Email, dan Password (min 6 karakter).");
      return;
    }

    setClientError("");
    setStep(2);
  };

  const isUserStep2 = role === "USER" && step === 2;
  const isCollectorStep2 = role === "COLLECTOR" && step === 2;

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white font-medium">
            {step > 1 ? <Check className="h-4 w-4" /> : "1"}
          </div>
          <span className={`text-sm font-medium ${step >= 1 ? "text-white" : "text-slate-500"}`}>
            Akun
          </span>
        </div>
        <div className="flex-1 px-4">
          <div className="h-px bg-white/10 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full font-medium ${
            step >= 2 ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-500"
          }`}>
            2
          </div>
          <span className={`text-sm font-medium ${step >= 2 ? "text-white" : "text-slate-500"}`}>
            Detail
          </span>
        </div>
      </div>

      <div className={step === 1 ? "space-y-4" : "hidden"}>
        <div className="space-y-2">
          <Label htmlFor="name">Nama lengkap</Label>
          <Input id="name" name="name" placeholder="Budi Santoso" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="budi@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Minimal 6 karakter" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Nomor telepon</Label>
          <Input id="phone" name="phone" placeholder="0812xxxxxxx" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Daftar sebagai</Label>
          <Select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="USER">User (Pengguna Aplikasi)</option>
            <option value="COLLECTOR">Collector (Pengepul / Bank Sampah)</option>
          </Select>
          <p className="text-xs text-slate-400 mt-1">
            {role === "USER" 
              ? "Sebagai User, Anda dapat memesan penjemputan sampah."
              : "Sebagai Collector, Anda dapat menerima pesanan penjemputan sampah dan mengatur harga beli."}
          </p>
        </div>
      </div>

      <div className={step === 2 ? "space-y-4" : "hidden"}>
        <PickupLocationPicker
          title={role === "USER" ? "Lokasi Rumah" : "Titik Lokasi Pengepul"}
          description={
            role === "USER"
              ? "Tentukan titik lokasi dimana sampah akan dijemput oleh collector."
              : "Tentukan titik lokasi pusat operasional atau gudang pengepul Anda."
          }
          addressName="address"
          addressLabel={role === "USER" ? "Alamat lengkap rumah" : "Alamat lengkap operasional"}
        />

        {isCollectorStep2 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 mt-6">
            <p className="text-base font-semibold text-white mb-1">Data Khusus Collector</p>
            <p className="text-sm text-slate-400 mb-6">
              Lengkapi informasi area kerja dan kapasitas harian Anda.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serviceAreaLabel">Area layanan</Label>
                <Input id="serviceAreaLabel" name="serviceAreaLabel" placeholder="Cimahi Selatan" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceRadiusKm">Radius layanan (km)</Label>
                <Input id="serviceRadiusKm" name="serviceRadiusKm" type="number" min="1" step="1" placeholder="5" />
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dailyCapacityKg">Kapasitas harian maksimal (kg)</Label>
                <Input id="dailyCapacityKg" name="dailyCapacityKg" type="number" min="1" step="1" placeholder="100" />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Label>Jenis sampah yang diterima</Label>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[
                  ["PLASTIC", "Plastik"],
                  ["PAPER", "Kertas"],
                  ["ORGANIC", "Organik"],
                  ["METAL", "Logam"],
                  ["GLASS", "Kaca"],
                ].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 cursor-pointer hover:bg-white/10 transition-colors">
                    <input type="checkbox" name="acceptedWasteTypes" value={value} className="h-4 w-4 bg-transparent rounded border-white/20 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <Label>Harga beli per kg (Rupiah)</Label>
              <p className="text-xs text-slate-400 -mt-2 mb-4">Biarkan default jika belum ada harga pasti.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="plasticPrice">Plastic</Label>
                  <Input id="plasticPrice" name="plasticPrice" type="number" min="100" step="100" defaultValue="3000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paperPrice">Paper</Label>
                  <Input id="paperPrice" name="paperPrice" type="number" min="100" step="100" defaultValue="2000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organicPrice">Organic</Label>
                  <Input id="organicPrice" name="organicPrice" type="number" min="100" step="100" defaultValue="1000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metalPrice">Metal</Label>
                  <Input id="metalPrice" name="metalPrice" type="number" min="100" step="100" defaultValue="5000" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="glassPrice">Glass</Label>
                  <Input id="glassPrice" name="glassPrice" type="number" min="100" step="100" defaultValue="1500" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {hasError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-sm text-red-400 font-medium">{errorMessage}</p>
        </div>
      )}

      {state.message && state.success && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
          <p className="text-sm text-emerald-400 font-medium">{state.message}</p>
        </div>
      )}

      <div className="pt-2">
        {step === 1 ? (
          <Button type="button" onClick={handleNext} className="w-full flex items-center justify-center gap-2">
            Lanjut
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={pending} className="flex-1 basis-1/3 text-white border-white/20 hover:bg-white/10 hover:text-white">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <Button type="submit" disabled={pending} className="flex-1 basis-2/3 bg-emerald-600 hover:bg-emerald-700 text-white border-none">
              {pending ? "Memproses..." : "Selesaikan Pendaftaran"}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
