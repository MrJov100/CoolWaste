"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { updateCollectorCapacity } from "@/lib/actions/settings";

type ActionState = { success: boolean; message: string };
const initialState: ActionState = { success: false, message: "" };

export function CapacityEditForm({
  defaultDailyCapacityKg,
  defaultServiceAreaLabel,
}: {
  defaultDailyCapacityKg: number;
  defaultServiceAreaLabel: string;
}) {
  const [state, formAction, pending] = useActionState(updateCollectorCapacity, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.message && (
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 ${
            state.success
              ? "border-emerald-500/20 bg-emerald-500/10"
              : "border-red-500/20 bg-red-500/10"
          }`}
        >
          {state.success ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          )}
          <p className={`text-sm ${state.success ? "text-emerald-300" : "text-red-300"}`}>
            {state.message}
          </p>
        </div>
      )}

      {/* Kapasitas harian */}
      <div>
        <label htmlFor="dailyCapacityKg" className="mb-2 block text-sm font-medium text-slate-300">
          Kapasitas Harian (kg)
        </label>
        <input
          id="dailyCapacityKg"
          name="dailyCapacityKg"
          type="number"
          min="1"
          step="1"
          defaultValue={defaultDailyCapacityKg || ""}
          placeholder="Contoh: 200"
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
        />
        <p className="mt-1 text-xs text-slate-500">Total berat pickup yang dapat diambil dalam satu hari</p>
      </div>

      {/* Area layanan */}
      <div>
        <label htmlFor="serviceAreaLabel" className="mb-2 block text-sm font-medium text-slate-300">
          Area Layanan
        </label>
        <input
          id="serviceAreaLabel"
          name="serviceAreaLabel"
          type="text"
          defaultValue={defaultServiceAreaLabel}
          placeholder="Contoh: Kebayoran Baru, Jakarta Selatan"
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
        />
        <p className="mt-1 text-xs text-slate-500">Nama area yang ditampilkan ke pengguna di dashboard</p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all ${
          pending
            ? "cursor-not-allowed bg-slate-800 text-slate-500"
            : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
        }`}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Menyimpan...
          </>
        ) : (
          "Simpan Perubahan"
        )}
      </button>
    </form>
  );
}
