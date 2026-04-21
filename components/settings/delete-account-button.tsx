"use client";

import { Trash2 } from "lucide-react";
import { deleteUserAccount } from "@/lib/actions/settings";

export function DeleteAccountButton() {
  return (
    <form action={deleteUserAccount}>
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm("Yakin hapus akun? Tindakan ini tidak bisa dibatalkan.")) {
            e.preventDefault();
          }
        }}
        className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-2.5 text-sm font-medium text-red-300 transition-all hover:bg-red-950/60 hover:text-red-200"
      >
        <Trash2 className="h-4 w-4" /> Hapus Akun Saya
      </button>
    </form>
  );
}
