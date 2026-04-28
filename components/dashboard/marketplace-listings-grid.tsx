"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PickupSlot, WasteType } from "@prisma/client";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Leaf,
  Loader2,
  MapPin,
  Package,
  Scale,
  Sparkles,
  Truck,
  Upload,
  X,
} from "lucide-react";

import type { CollectorServiceCard, SavedAddressOption } from "@/lib/types";
import { createPickupRequest } from "@/lib/actions/dashboard";
import { PICKUP_SLOT_LABEL, PICKUP_SLOT_OPTIONS, PRICE_PER_KG, WASTE_TYPE_OPTIONS } from "@/lib/constants";
import { formatCurrency, titleCase } from "@/lib/utils";
import { PickupLocationPicker } from "@/components/dashboard/pickup-location-picker";
import { Badge } from "@/components/ui/badge";

type ActionState = { success: boolean; message: string };
const initialState: ActionState = { success: false, message: "" };

type WasteAiSuggestion = {
  predictedClass: WasteType | null;
  rawPredictedClass: string | null;
  confidence: number | null;
  reviewRequired: boolean;
  autoApplied: boolean;
  caseId: string | null;
  candidates: Array<{ wasteType: WasteType; confidence: number | null }>;
};

const WASTE_ICONS: Record<string, string> = {
  plastic: "🧴",
  paper: "📄",
  organic: "🌿",
  metal: "🔩",
  glass: "🫙",
};

const SLOT_ICONS: Record<string, string> = {
  PAGI: "🌅",
  SIANG: "☀️",
  SORE: "🌆",
};

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
  const [state, formAction, pending] = useActionState(createPickupRequest, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [wasteType, setWasteType] = useState<string>(WasteType.PLASTIC);
  const [weight, setWeight] = useState<string>("");
  const [slot, setSlot] = useState<string>(PickupSlot.PAGI);
  const [addressId, setAddressId] = useState<string>(defaultAddress?.id ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string>("");
  const [photoError, setPhotoError] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<WasteAiSuggestion | null>(null);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [aiMessage, setAiMessage] = useState("");

  const MIN_WEIGHT = 3;
  const weightNum = parseFloat(weight) || 0;
  const selectedWasteKey = wasteType.toLowerCase() as keyof typeof PRICE_PER_KG;
  const pricePerKg = PRICE_PER_KG[selectedWasteKey] ?? 0;
  const estimatedMin = Math.round(pricePerKg * Math.max(weightNum, 0));
  const estimatedMax = Math.round(estimatedMin * 1.1);

  const isWeightValid = weightNum >= MIN_WEIGHT;
  const isPhotoValid = photoFile !== null;
  const isSlotValid = slot !== "";
  const isFormValid = isWeightValid && isPhotoValid && isSlotValid;

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      clearPhoto();
      setWeight("");
      setAiSuggestion(null);
      setAiStatus("idle");
      setAiMessage("");
      formRef.current?.reset();
      setWasteType(WasteType.PLASTIC);
      setSlot(PickupSlot.PAGI);
      const t = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoError("");
    setAiSuggestion(null);
    setAiStatus("loading");
    setAiMessage("AI sedang menganalisis foto sampah...");
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    void classifyPhoto(file);
  }

  function clearPhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setAiSuggestion(null);
    setAiStatus("idle");
    setAiMessage("");
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  async function classifyPhoto(file: File) {
    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/ai/waste-classify", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "AI classifier tidak tersedia saat ini.");
      }

      const suggestion = payload.data as WasteAiSuggestion;
      setAiSuggestion(suggestion);
      setAiStatus("success");

      if (suggestion.predictedClass && suggestion.autoApplied) {
        setWasteType(suggestion.predictedClass);
        setAiMessage(
          `AI mendeteksi ${titleCase(suggestion.predictedClass)}${
            suggestion.confidence != null ? ` dengan confidence ${Math.round(suggestion.confidence * 100)}%` : ""
          }. Jenis sampah sudah dipilih otomatis.`,
        );
        return;
      }

      if (suggestion.predictedClass) {
        setAiMessage(
          `AI menyarankan ${titleCase(suggestion.predictedClass)}${
            suggestion.confidence != null ? ` (${Math.round(suggestion.confidence * 100)}%)` : ""
          }. Tinjau dulu sebelum submit.`,
        );
        return;
      }

      setAiMessage("AI belum bisa menentukan kategori sampah dari foto ini. Pilih manual.");
    } catch (error) {
      setAiStatus("error");
      setAiMessage(error instanceof Error ? error.message : "AI classifier tidak tersedia saat ini.");
    }
  }

  function applyAiSuggestion() {
    if (!aiSuggestion?.predictedClass) return;
    setWasteType(aiSuggestion.predictedClass);
    setAiMessage(
      `Saran AI diterapkan ke ${titleCase(aiSuggestion.predictedClass)}${
        aiSuggestion.confidence != null ? ` (${Math.round(aiSuggestion.confidence * 100)}%)` : ""
      }.`,
    );
  }

  function handleWeightChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setWeight(val);
    const num = parseFloat(val) || 0;
    if (val && num < MIN_WEIGHT) {
      setWeightError(`Minimal berat ${MIN_WEIGHT} kg`);
    } else {
      setWeightError("");
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    let hasError = false;
    if (!isWeightValid) {
      setWeightError(`Minimal berat ${MIN_WEIGHT} kg`);
      hasError = true;
    }
    if (!isPhotoValid) {
      setPhotoError("Foto sampah wajib diupload");
      hasError = true;
    }
    if (hasError) {
      e.preventDefault();
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[3fr_2fr]">
      {/* ── Pickup Request Form ── */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Request Pickup</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        {showSuccess && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-300">Request pickup berhasil dibuat!</p>
              <p className="text-xs text-emerald-400/70">Sistem sedang mencarikan collector terbaik untukmu.</p>
            </div>
          </div>
        )}

        {state.message && !state.success && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{state.message}</p>
          </div>
        )}

        <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="space-y-5">
          {/* Jenis Sampah */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Jenis Sampah <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {WASTE_TYPE_OPTIONS.map((type) => {
                const key = type.toLowerCase();
                const isSelected = wasteType === type.toUpperCase();
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setWasteType(type.toUpperCase())}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-medium transition-all ${
                      isSelected
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="text-xl">{WASTE_ICONS[key]}</span>
                    <span>{titleCase(type)}</span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="wasteType" value={wasteType} />
          </div>

          {/* Berat Sampah */}
          <div>
            <label htmlFor="estimatedWeightKg" className="mb-2 block text-sm font-medium text-slate-300">
              Estimasi Berat <span className="text-red-400">*</span>
              <span className="ml-2 text-xs text-slate-500">(min. {MIN_WEIGHT} kg)</span>
            </label>
            <div className="relative">
              <Scale className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="estimatedWeightKg"
                name="estimatedWeightKg"
                type="number"
                min="0.1"
                step="0.1"
                value={weight}
                onChange={handleWeightChange}
                placeholder={`Minimal ${MIN_WEIGHT} kg`}
                className={`w-full rounded-2xl border bg-white/[0.03] py-3 pl-10 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 ${
                  weightError
                    ? "border-red-500/50 focus:ring-red-500/30"
                    : isWeightValid && weight
                    ? "border-emerald-500/40 focus:ring-emerald-500/30"
                    : "border-white/10 focus:ring-emerald-500/30"
                }`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">kg</span>
            </div>
            {weightError ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
                <AlertCircle className="h-3 w-3" /> {weightError}
              </p>
            ) : isWeightValid && weight ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Berat valid
              </p>
            ) : null}
          </div>

          {/* Foto Sampah */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Foto Sampah <span className="text-red-400">*</span>
            </label>

            {/* Input file selalu ada di DOM agar FormData mengandung field "photo" saat submit */}
            <input
              ref={photoInputRef}
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handlePhotoChange}
            />

            {photoPreview ? (
              <div className="relative">
                <div className="relative h-48 overflow-hidden rounded-2xl bg-slate-950">
                  <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 hover:bg-red-900/60 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Foto siap diupload
                </p>
              </div>
            ) : (
              <label
                htmlFor="photo"
                className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed p-6 transition-all hover:bg-white/[0.03] ${
                  photoError ? "border-red-500/50 bg-red-500/5" : "border-white/15 bg-white/[0.02]"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800">
                  <Upload className="h-5 w-5 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-300">Upload foto sampah</p>
                  <p className="mt-0.5 text-xs text-slate-500">JPG, PNG, WEBP — maks. 10MB</p>
                </div>
              </label>
            )}
            {photoError && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
                <AlertCircle className="h-3 w-3" /> {photoError}
              </p>
            )}
            {aiStatus !== "idle" && !photoError && (
              <div
                className={`mt-3 rounded-2xl border p-3 text-sm ${
                  aiStatus === "loading"
                    ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-200"
                    : aiStatus === "error"
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                    : aiSuggestion?.autoApplied
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                    : "border-white/10 bg-white/[0.03] text-slate-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  {aiStatus === "loading" ? (
                    <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                  ) : aiStatus === "error" ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Analisis AI foto sampah</p>
                    <p className="mt-1 text-xs text-current/80">{aiMessage}</p>
                    {aiSuggestion?.candidates?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {aiSuggestion.candidates.slice(0, 3).map((candidate) => (
                          <span
                            key={candidate.wasteType}
                            className="rounded-xl border border-white/10 bg-black/10 px-2 py-1 text-[11px]"
                          >
                            {titleCase(candidate.wasteType)}
                            {candidate.confidence != null ? ` ${Math.round(candidate.confidence * 100)}%` : ""}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {aiStatus === "success" && aiSuggestion?.predictedClass && !aiSuggestion.autoApplied ? (
                      <button
                        type="button"
                        onClick={applyAiSuggestion}
                        className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/15"
                      >
                        Gunakan saran AI
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Alamat */}
          <div>
            <label htmlFor="addressId" className="mb-2 block text-sm font-medium text-slate-300">
              Alamat Pickup <span className="text-red-400">*</span>
            </label>
            {savedAddresses.length > 0 ? (
              <div className="space-y-2">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => setAddressId(addr.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition-all ${
                      addressId === addr.id
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className={`h-4 w-4 ${addressId === addr.id ? "text-emerald-400" : "text-slate-500"}`} />
                        <span className="text-sm font-medium text-white">{addr.label}</span>
                        {addr.isDefault && (
                          <Badge variant="emerald" className="text-xs">Default</Badge>
                        )}
                      </div>
                      {addressId === addr.id && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    </div>
                    <p className="mt-1 pl-6 text-xs text-slate-400 line-clamp-1">{addr.address}</p>
                  </button>
                ))}
                <Link
                  href="/settings"
                  className="flex items-center gap-2 rounded-2xl border border-dashed border-white/10 p-3 text-sm text-slate-400 transition-all hover:border-white/20 hover:text-slate-300"
                >
                  <MapPin className="h-4 w-4" />
                  Tambah alamat baru
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Link>
              </div>
            ) : (
              <Link
                href="/settings"
                className="flex items-center gap-3 rounded-2xl border border-dashed border-white/15 p-4 text-slate-400 hover:border-white/25 hover:text-slate-300"
              >
                <MapPin className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Belum ada alamat tersimpan</p>
                  <p className="text-xs text-slate-500">Klik untuk tambah di pengaturan</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4" />
              </Link>
            )}
            <input type="hidden" name="addressId" value={addressId} />
          </div>

          {/* Map picker jika tidak ada alamat tersimpan atau addressId kosong */}
          {!addressId && (
            <PickupLocationPicker
              title="Titik lokasi pickup"
              description="Pilih titik pickup di peta."
              addressName="addressText"
              addressLabel="Lokasi pickup"
              initialLatitude={defaultAddress?.latitude}
              initialLongitude={defaultAddress?.longitude}
              initialAddress={defaultAddress?.address}
            />
          )}
          {addressId && (
            <input
              type="hidden"
              name="addressText"
              value={savedAddresses.find((a) => a.id === addressId)?.address ?? ""}
            />
          )}

          {/* Slot Waktu */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Slot Waktu Pickup <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PICKUP_SLOT_OPTIONS.map((s) => {
                const isSelected = slot === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-medium transition-all ${
                      isSelected
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xl">{SLOT_ICONS[s]}</span>
                    <span className="text-center leading-tight">{PICKUP_SLOT_LABEL[s].split(" ")[0]}</span>
                    <span className="text-center text-[10px] leading-tight text-slate-500">
                      {PICKUP_SLOT_LABEL[s].match(/\((.+)\)/)?.[1]}
                    </span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="pickupSlot" value={slot} />
          </div>

          {/* Catatan */}
          <div>
            <label htmlFor="notes" className="mb-2 block text-sm font-medium text-slate-300">
              Catatan <span className="text-xs text-slate-500">(opsional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Contoh: sudah dipilah, bisa diambil di teras depan."
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>

          {/* Estimasi harga */}
          {weightNum >= MIN_WEIGHT && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs text-emerald-400/70">Estimasi pendapatan</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">
                {formatCurrency(estimatedMin)} – {formatCurrency(estimatedMax)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Berdasarkan {formatCurrency(pricePerKg)}/kg × {weightNum.toFixed(1)} kg. Harga final ditentukan collector.
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={pending || !isFormValid}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all ${
              isFormValid && !pending
                ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                : "cursor-not-allowed bg-slate-800 text-slate-500"
            }`}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses request...
              </>
            ) : (
              <>
                <Package className="h-4 w-4" />
                Request Pickup Sekarang
              </>
            )}
          </button>

          {!isFormValid && !pending && (
            <p className="text-center text-xs text-slate-500">
              {!isWeightValid && weight ? "⚠ Berat minimal 3 kg · " : ""}
              {!isPhotoValid ? "⚠ Upload foto · " : ""}
              {!isSlotValid ? "⚠ Pilih slot waktu" : ""}
            </p>
          )}
        </form>
      </div>

      {/* ── Collector Cards ── */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Collector Tersedia</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Collector Siap Matching</h2>
          {/* Range harga per kategori */}
          <div className="mt-3 flex flex-wrap gap-2">
            {WASTE_TYPE_OPTIONS.map((type) => {
              const key = type.toLowerCase() as keyof typeof PRICE_PER_KG;
              const minPrice = PRICE_PER_KG[key];
              const maxPrice = Math.round(minPrice * 1.4);
              return (
                <span
                  key={type}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium ${
                    key === selectedWasteKey
                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                      : "bg-white/[0.04] text-slate-400"
                  }`}
                >
                  <span>{WASTE_ICONS[key]}</span>
                  <span>{titleCase(type)}</span>
                  <span className="text-slate-500">·</span>
                  <span>{formatCurrency(minPrice)}–{formatCurrency(maxPrice)}/kg</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {collectors.length ? (
            collectors.map((collector) => (
              <CollectorCard key={collector.id} collector={collector} selectedWasteType={selectedWasteKey} />
            ))
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/10 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
                <Truck className="h-6 w-6 text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-400">Belum ada collector terverifikasi</p>
              <p className="text-xs text-slate-600">Collector baru sedang dalam proses verifikasi admin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CollectorCard({
  collector,
  selectedWasteType,
}: {
  collector: CollectorServiceCard;
  selectedWasteType: keyof typeof PRICE_PER_KG;
}) {
  const capacityPct = collector.dailyCapacityKg > 0
    ? Math.min((collector.remainingCapacityKg / collector.dailyCapacityKg) * 100, 100)
    : 0;
  const capacityColor =
    capacityPct > 60 ? "bg-emerald-500" : capacityPct > 30 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.05]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <Truck className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-white">{collector.collectorName}</h3>
            <Badge variant="emerald" className="shrink-0 text-xs">Verified</Badge>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{collector.serviceAreaLabel}</span>
          </p>
        </div>
      </div>

      {/* Kapasitas */}
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <Scale className="h-3 w-3" /> Kapasitas tersisa
          </p>
          <p className="text-xs font-medium text-slate-300">
            {collector.remainingCapacityKg.toFixed(1)} / {collector.dailyCapacityKg.toFixed(0)} kg
          </p>
        </div>
        {/* Bar: sisa kapasitas aktif (TERJADWAL + DALAM_PERJALANAN) */}
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all ${capacityColor}`}
            style={{ width: `${capacityPct}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-slate-600">
          Terpakai hari ini: {collector.todayUsedKg.toFixed(1)} kg
          {collector.todayUsedKg > collector.dailyCapacityKg - collector.remainingCapacityKg
            ? ` (termasuk ${(collector.todayUsedKg - (collector.dailyCapacityKg - collector.remainingCapacityKg)).toFixed(1)} kg selesai)`
            : ""}
        </p>
      </div>

      {/* Waste types yang diterima */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {collector.acceptedWasteTypes.map((type) => {
          const key = type.toLowerCase() as keyof typeof PRICE_PER_KG;
          const isActive = key === selectedWasteType;
          return (
            <span
              key={type}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-white/[0.04] text-slate-400"
              }`}
            >
              {WASTE_ICONS[key]} {titleCase(type)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
