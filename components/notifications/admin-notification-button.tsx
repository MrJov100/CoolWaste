"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Bell, FileWarning, X } from "lucide-react";

const POLL_INTERVAL_MS = 15_000;

export type AdminReportNotif = {
  id: string;
  reportedByName: string;
  reportedUserName: string;
  reason: string;
  pickupRequestNo: string;
  createdAt: Date;
  status: string;
};

export function AdminNotificationButton({
  reports,
  openCount,
}: {
  reports: AdminReportNotif[];
  openCount: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Poll for new reports every 15 s
  useEffect(() => {
    const id = setInterval(() => {
      startTransition(() => router.refresh());
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const STATUS_COLOR: Record<string, string> = {
    OPEN: "text-red-400",
    REVIEWED: "text-amber-400",
    RESOLVED: "text-emerald-400",
  };
  const STATUS_LABEL: Record<string, string> = {
    OPEN: "Terbuka",
    REVIEWED: "Ditinjau",
    RESOLVED: "Selesai",
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifikasi laporan"
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
          open
            ? "border-red-500/40 bg-red-500/15 text-red-300"
            : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:text-white"
        }`}
      >
        <Bell className="h-4 w-4" />
        {openCount > 0 && !open && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-slate-950 bg-red-500 px-0.5 text-[9px] font-bold text-white">
            {openCount > 99 ? "99+" : openCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 flex w-80 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl">

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/15">
                  <FileWarning className="h-3 w-3 text-red-400" />
                </div>
                <p className="text-xs font-semibold text-white">Laporan Masuk</p>
                {openCount > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {openCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto py-1">
              {reports.length > 0 ? (
                reports.slice(0, 8).map((r) => (
                  <Link
                    key={r.id}
                    href={`/dashboard/admin/reports/${r.id}`}
                    onClick={() => setOpen(false)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] ${
                      r.status === "OPEN" ? "bg-white/[0.025]" : ""
                    }`}
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-800">
                      <FileWarning className="h-3.5 w-3.5 text-red-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-semibold leading-tight text-white">
                          {r.reportedByName} melaporkan {r.reportedUserName}
                        </p>
                        {r.status === "OPEN" && (
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[10px] leading-relaxed text-slate-500">
                        {r.reason}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`text-[9px] font-semibold ${STATUS_COLOR[r.status] ?? "text-slate-500"}`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                        <span className="text-[9px] text-slate-600">
                          · {format(new Date(r.createdAt), "dd MMM, HH:mm", { locale: localeId })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800">
                    <Bell className="h-4 w-4 text-slate-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">Tidak ada laporan</p>
                  <p className="text-[10px] text-slate-600">
                    Laporan baru dari pengguna akan muncul di sini.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {reports.length > 0 && (
              <div className="border-t border-white/[0.07] p-2">
                <Link
                  href="/dashboard/admin/reports"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  Lihat semua laporan
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
