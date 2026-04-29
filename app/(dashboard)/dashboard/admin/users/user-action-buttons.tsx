"use client";

import { useTransition } from "react";
import { ShieldCheck, ShieldX, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

import {
  blockUser,
  deleteUser,
  rejectCollector,
  unblockUser,
} from "@/lib/actions/admin";
import { verifyCollector } from "@/lib/actions/dashboard";
import { Button } from "@/components/ui/button";

const swalBase = {
  background: "#0f172a",
  color: "#e2e8f0",
  confirmButtonColor: "#10b981",
  cancelButtonColor: "#475569",
  customClass: {
    popup: "!rounded-2xl !border !border-white/10",
    title: "!text-white !text-lg",
    htmlContainer: "!text-slate-400 !text-sm",
    confirmButton: "!rounded-xl !px-5 !py-2 !text-sm !font-semibold",
    cancelButton: "!rounded-xl !px-5 !py-2 !text-sm !font-semibold",
  },
};

/* ── Collector: Verifikasi ── */
export function VerifyCollectorButton({
  collectorId,
  collectorName,
}: {
  collectorId: string;
  collectorName: string;
}) {
  const [pending, start] = useTransition();

  async function handleClick() {
    const result = await Swal.fire({
      ...swalBase,
      title: "Verifikasi Collector?",
      html: `Akun <strong class="text-white">${collectorName}</strong> akan diverifikasi dan dapat mulai menerima pickup.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Verifikasi",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10b981",
    });
    if (!result.isConfirmed) return;
    start(() => verifyCollector(collectorId));
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      onClick={handleClick}
      className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      {pending ? "Memproses..." : "Verifikasi"}
    </Button>
  );
}

/* ── Collector: Tolak (reject pending) ── */
export function RejectCollectorButton({
  collectorId,
  collectorName,
}: {
  collectorId: string;
  collectorName: string;
}) {
  const [pending, start] = useTransition();

  async function handleClick() {
    const result = await Swal.fire({
      ...swalBase,
      title: "Tolak Pendaftaran?",
      html: `Pendaftaran collector <strong class="text-white">${collectorName}</strong> akan ditolak. Collector akan mendapat notifikasi.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Tolak",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;
    start(() => rejectCollector(collectorId));
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={handleClick}
      className="w-full gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs"
    >
      <ShieldX className="h-3.5 w-3.5" />
      {pending ? "Memproses..." : "Tolak"}
    </Button>
  );
}

/* ── Blokir (User atau Collector terverifikasi) ── */
export function BlockUserButton({
  userId,
  userName,
  role,
}: {
  userId: string;
  userName: string;
  role: "USER" | "COLLECTOR";
}) {
  const [pending, start] = useTransition();

  async function handleClick() {
    const { value: formValues, isConfirmed } = await Swal.fire({
      ...swalBase,
      title: "Blokir Akun?",
      html: `
        <p class="mb-4">Akun <strong class="text-white">${userName}</strong> (${role === "COLLECTOR" ? "Collector" : "User"}) akan diblokir dan tidak dapat menggunakan layanan.</p>
        <div class="flex flex-col gap-3 text-left">
          <div>
            <label class="block mb-1 text-xs text-slate-400">Alasan pemblokiran</label>
            <input id="swal-reason" class="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
              value="Pelanggaran ketentuan layanan" />
          </div>
          <div>
            <label class="block mb-1 text-xs text-slate-400">Durasi blokir (hari)</label>
            <input id="swal-duration" type="number" min="1" max="365"
              class="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
              value="7" />
          </div>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Blokir",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      preConfirm: () => ({
        reason: (document.getElementById("swal-reason") as HTMLInputElement).value.trim() || "Pelanggaran ketentuan layanan",
        durationDays: Number((document.getElementById("swal-duration") as HTMLInputElement).value) || 7,
      }),
    });

    if (!isConfirmed || !formValues) return;

    start(async () => {
      const fd = new FormData();
      fd.append("reason", formValues.reason);
      fd.append("durationDays", String(formValues.durationDays));
      await blockUser(userId, fd);
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={handleClick}
      className="w-full gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs"
    >
      <ShieldX className="h-3.5 w-3.5" />
      {pending ? "Memproses..." : "Blokir"}
    </Button>
  );
}

/* ── Aktifkan / Unblokir ── */
export function UnblockUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [pending, start] = useTransition();

  async function handleClick() {
    const result = await Swal.fire({
      ...swalBase,
      title: "Aktifkan Akun?",
      html: `Akun <strong class="text-white">${userName}</strong> akan diaktifkan kembali dan dapat menggunakan layanan.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Aktifkan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10b981",
    });
    if (!result.isConfirmed) return;
    start(() => unblockUser(userId));
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={handleClick}
      className="w-full gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs"
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      {pending ? "Memproses..." : "Aktifkan"}
    </Button>
  );
}

/* ── Hapus Akun ── */
export function DeleteUserButton({
  userId,
  userName,
  role,
}: {
  userId: string;
  userName: string;
  role: "USER" | "COLLECTOR";
}) {
  const [pending, start] = useTransition();

  async function handleClick() {
    const result = await Swal.fire({
      ...swalBase,
      title: "Hapus Akun Permanen?",
      html: `
        <p class="mb-3">Akun <strong class="text-white">${userName}</strong> (${role === "COLLECTOR" ? "Collector" : "User"}) akan dihapus secara permanen.</p>
        <p class="text-red-400 text-xs font-semibold">⚠️ Tindakan ini tidak dapat dibatalkan. Semua data terkait akun ini akan ikut terhapus.</p>
      `,
      icon: "error",
      showCancelButton: true,
      confirmButtonText: "Hapus Permanen",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    start(() => deleteUser(userId));
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={handleClick}
      className="w-full gap-1.5 border-slate-500/40 text-slate-400 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10 text-xs"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Menghapus..." : "Hapus"}
    </Button>
  );
}
