"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      className="gap-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden lg:inline">{pending ? "Keluar..." : "Keluar"}</span>
    </Button>
  );
}
