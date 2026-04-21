"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Flag,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { submitCollectorReport } from "@/lib/actions/report";

type ActionState = { success: boolean; message: string };
const initialState: ActionState = { success: false, message: "" };

const REPORT_REASONS = [
  { value: "TIDAK_DATANG", label: "Tidak datang sesuai jadwal" },
  { value: "TIDAK_SOPAN", label: "Berperilaku tidak sopan / kasar" },
  { value: "TIMBANG_TIDAK_JUJUR", label: "Menimbang tidak jujur / timbangan dimanipulasi" },
  { value: "HARGA_TIDAK_SESUAI", label: "Harga tidak sesuai kesepakatan" },
  { value: "AMBIL_BARANG_LAIN", label: "Mengambil barang di luar yang disepakati" },
  { value: "ANCAMAN", label: "Memberi ancaman atau intimidasi" },
  { value: "LAINNYA", label: "Alasan lainnya" },
] as const;

type ReasonValue = typeof REPORT_REASONS[number]["value"];

export function ReportForm({
  pickupId,
  pickupRequestNo,
  collectorName,
}: {
  pickupId: string;
  pickupRequestNo: string;
  collectorName: string;
}) {
  const [state, formAction, pending] = useActionState(submitCollectorReport, initialState);
  const [reason, setReason] = useState<ReasonValue | "">("");
  const [description, setDescription] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");

  const MIN_DESC = 20;
  const MAX_DESC = 1000;
  const MAX_FILE_MB = 5;

  const isFormValid =
    reason !== "" &&
    description.length >= MIN_DESC &&
    description.length <= MAX_DESC &&
    !fileError;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setFileError("File harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`Ukuran file maksimal ${MAX_FILE_MB} MB.`);
      return;
    }

    setEvidenceFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEvidencePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removeFile() {
    setEvidenceFile(null);
    setEvidencePreview(null);
    setFileError("");
  }

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Laporan Terkirim</h2>
          <p className="mt-2 text-sm text-slate-400">{state.message}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/my-reports"
            className="rounded-2xl bg-emerald-500/20 px-5 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30"
          >
            Lihat Status Laporan
          </Link>
          <Link
            href="/pickups"
            className="rounded-2xl border border-white/10 px-5 py-2.5 text-sm text-slate-400 hover:border-white/20 hover:text-slate-200"
          >
            Kembali ke Pickup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="pickupId" value={pickupId} />

      {/* Error state */}
      {state.message && !state.success && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">{state.message}</p>
        </div>
      )}

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="text-sm">
          <p className="font-medium text-amber-300">Gunakan fitur ini dengan bertanggung jawab</p>
          <p className="mt-0.5 text-amber-400/70">
            Laporan palsu atau tidak berdasar dapat mengakibatkan pembatasan akun. Laporan kamu akan ditinjau dalam 1–3 hari kerja.
          </p>
        </div>
      </div>

      {/* Section 1: Reason */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Langkah 1 dari 3
        </p>
        <h2 className="mb-4 text-base font-semibold text-white">
          Apa yang terjadi dengan <span className="text-red-300">{collectorName}</span>?
        </h2>
        <div className="space-y-2">
          {REPORT_REASONS.map((r) => {
            const isSelected = reason === r.value;
            return (
              <label
                key={r.value}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-all ${
                  isSelected
                    ? "border-red-500/40 bg-red-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={isSelected}
                  onChange={() => setReason(r.value)}
                  className="sr-only"
                />
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    isSelected ? "border-red-400 bg-red-400" : "border-slate-600"
                  }`}
                >
                  {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <span className={`text-sm ${isSelected ? "font-medium text-red-200" : "text-slate-300"}`}>
                  {r.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 2: Description */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Langkah 2 dari 3
        </p>
        <h2 className="mb-1 text-base font-semibold text-white">Ceritakan kronologinya</h2>
        <p className="mb-4 text-xs text-slate-500">
          Minimal {MIN_DESC} karakter. Semakin detail, semakin mudah tim kami meninjau.
        </p>
        <textarea
          name="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contoh: Collector tidak datang pada slot Pagi (08.00-11.00). Saya sudah menunggu dan menghubungi via chat, tapi tidak ada respons..."
          className={`w-full resize-none rounded-2xl border bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-colors ${
            description.length > 0 && description.length < MIN_DESC
              ? "border-red-500/40 focus:ring-red-500/30"
              : description.length >= MIN_DESC
              ? "border-emerald-500/30 focus:ring-emerald-500/30"
              : "border-white/10 focus:ring-emerald-500/30"
          }`}
        />
        <div className="mt-1.5 flex items-center justify-between">
          {description.length > 0 && description.length < MIN_DESC ? (
            <p className="flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />
              Tambah {MIN_DESC - description.length} karakter lagi
            </p>
          ) : description.length >= MIN_DESC ? (
            <p className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Deskripsi valid
            </p>
          ) : (
            <span />
          )}
          <p className={`text-xs tabular-nums ${description.length > MAX_DESC - 50 ? "text-red-400" : "text-slate-600"}`}>
            {description.length.toLocaleString()}/{MAX_DESC.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Section 3: Evidence */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Langkah 3 dari 3
        </p>
        <h2 className="mb-1 text-base font-semibold text-white">
          Lampirkan bukti foto{" "}
          <span className="text-sm font-normal text-slate-500">(opsional)</span>
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          Screenshot percakapan, foto kondisi barang, atau bukti visual lainnya. Maks {MAX_FILE_MB} MB.
        </p>

        {evidencePreview ? (
          <div className="space-y-3">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950">
              <Image src={evidencePreview} alt="Bukti" fill className="object-cover" />
              <button
                type="button"
                onClick={removeFile}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-red-900/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {evidenceFile?.name} ({((evidenceFile?.size ?? 0) / 1024 / 1024).toFixed(1)} MB)
            </p>
          </div>
        ) : (
          <label
            htmlFor="evidence"
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center transition-all hover:bg-white/[0.03] ${
              fileError ? "border-red-500/40 bg-red-500/5" : "border-white/15 bg-white/[0.02]"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800">
              <Upload className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Klik untuk upload foto bukti</p>
              <p className="mt-0.5 text-xs text-slate-500">JPG, PNG, WEBP — Maks {MAX_FILE_MB} MB</p>
            </div>
            <input
              id="evidence"
              name="evidence"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleFile}
            />
          </label>
        )}
        {fileError && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5" /> {fileError}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending || !isFormValid}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold transition-all ${
          isFormValid && !pending
            ? "bg-red-500/80 text-white shadow-lg shadow-red-950/30 hover:bg-red-500"
            : "cursor-not-allowed bg-slate-800 text-slate-500"
        }`}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mengirim laporan...
          </>
        ) : (
          <>
            <Flag className="h-4 w-4" />
            Kirim Laporan ke Admin
          </>
        )}
      </button>

      {!isFormValid && !pending && (
        <p className="text-center text-xs text-slate-600">
          Lengkapi semua langkah wajib sebelum mengirim laporan
        </p>
      )}

      <p className="text-center text-xs text-slate-600">
        Laporan ditinjau tim CoolWaste dalam 1–3 hari kerja · Pickup #{pickupRequestNo}
      </p>
    </form>
  );
}
