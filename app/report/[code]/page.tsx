"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Flag,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";

import { submitCollectorReport } from "@/lib/actions/report";

type ActionState = { success: boolean; message: string };
const initialState: ActionState = { success: false, message: "" };

const REPORT_REASONS = [
  "Tidak datang sesuai jadwal",
  "Berperilaku tidak sopan / kasar",
  "Menimbang tidak jujur / timbangan dimanipulasi",
  "Harga tidak sesuai kesepakatan",
  "Mengambil barang di luar yang disepakati",
  "Memberi ancaman atau intimidasi",
  "Alasan lainnya",
];

export default function ReportPage() {
  const { code } = useParams() as { code: string };
  const [state, formAction, pending] = useActionState(submitCollectorReport, initialState);

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);

  const isFormValid = reason.length > 0 && description.length >= 20;

  function handleEvidenceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenceFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEvidencePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  if (state.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md w-full rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Laporan Terkirim</h2>
          <p className="mt-3 text-sm text-slate-400">{state.message}</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/20 px-5 py-3 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/pickups"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-400" />
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
                Laporkan Collector
              </h1>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">Request #{code}</p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-300">Gunakan fitur ini dengan bertanggung jawab</p>
            <p className="mt-1 text-xs text-amber-400/70">
              Laporan palsu dapat berdampak pada akun kamu. Pastikan kamu memiliki bukti yang valid sebelum melaporkan.
            </p>
          </div>
        </div>

        {/* Error message */}
        {state.message && !state.success && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{state.message}</p>
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="pickupRequestId" value="" />

          {/* Reason */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="mb-4 font-semibold text-white">1. Pilih Alasan Laporan</h2>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all ${
                    reason === r
                      ? "border-red-500/40 bg-red-500/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      reason === r ? "border-red-400 bg-red-400" : "border-slate-600"
                    }`}
                  >
                    {reason === r && <div className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                  </div>
                  <span className={`text-sm ${reason === r ? "text-red-300" : "text-slate-300"}`}>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="mb-1 font-semibold text-white">2. Jelaskan Kronologi</h2>
            <p className="mb-4 text-xs text-slate-500">Minimal 20 karakter. Ceritakan apa yang terjadi secara detail.</p>
            <textarea
              name="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan apa yang terjadi..."
              className={`w-full resize-none rounded-2xl border bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 ${
                description.length > 0 && description.length < 20
                  ? "border-red-500/40 focus:ring-red-500/30"
                  : description.length >= 20
                  ? "border-emerald-500/30 focus:ring-emerald-500/30"
                  : "border-white/10 focus:ring-emerald-500/30"
              }`}
            />
            <div className="mt-1.5 flex items-center justify-between">
              {description.length > 0 && description.length < 20 ? (
                <p className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" /> Minimal 20 karakter
                </p>
              ) : (
                <span />
              )}
              <p className={`text-xs ${description.length > 900 ? "text-red-400" : "text-slate-600"}`}>
                {description.length}/1000
              </p>
            </div>
          </div>

          {/* Evidence photo */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="mb-1 font-semibold text-white">3. Upload Bukti Foto</h2>
            <p className="mb-4 text-xs text-slate-500">Opsional — screenshot percakapan, foto barang, atau bukti lainnya.</p>

            {evidencePreview ? (
              <div className="relative">
                <div className="relative h-48 overflow-hidden rounded-2xl bg-slate-950">
                  <Image src={evidencePreview} alt="Bukti" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => { setEvidenceFile(null); setEvidencePreview(null); }}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 hover:bg-red-900/60 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Bukti siap dilampirkan
                </p>
              </div>
            ) : (
              <label
                htmlFor="evidence"
                className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800">
                  <Upload className="h-5 w-5 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-300">Upload foto bukti</p>
                  <p className="mt-0.5 text-xs text-slate-500">JPG, PNG, WEBP — Opsional</p>
                </div>
                <input
                  id="evidence"
                  name="evidence"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleEvidenceChange}
                />
              </label>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pending || !isFormValid}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all ${
              isFormValid && !pending
                ? "bg-red-500/80 text-white hover:bg-red-500"
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
                Kirim Laporan
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-600">
            Laporan akan ditinjau oleh tim CoolWaste dalam 1–3 hari kerja
          </p>
        </form>
      </div>
    </div>
  );
}
