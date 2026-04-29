"use client";

import { Trash2 } from "lucide-react";
import { deleteUser } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function DeleteUserForm({ userId, userName }: { userId: string; userName: string }) {
  return (
    <form
      action={deleteUser.bind(null, userId)}
      onSubmit={(e) => {
        if (!confirm(`Hapus akun ${userName} secara permanen?`)) e.preventDefault();
      }}
    >
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="w-full gap-1.5 border-slate-500/40 text-slate-400 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10 text-xs"
      >
        <Trash2 className="h-3.5 w-3.5" /> Hapus
      </Button>
    </form>
  );
}
