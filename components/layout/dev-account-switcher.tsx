"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Code2, Loader2 } from "lucide-react";

import { switchDevAccount } from "@/app/(auth)/actions";
import { DEV_ACCOUNTS } from "@/lib/dev-accounts";

export function DevAccountSwitcher({ currentEmail }: { currentEmail?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentAccount = DEV_ACCOUNTS.find((a) => a.email === currentEmail) ?? { label: "Dev Login" };

  function handleSwitch(email: string) {
    setSwitching(email);
    setOpen(false);
    const fd = new FormData();
    fd.append("email", email);
    fd.append("redirectTo", pathname);
    startTransition(() => switchDevAccount(fd));
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-500 transition-all hover:bg-amber-500/20"
      >
        {switching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Code2 className="h-4 w-4" />
        )}
        <span className="hidden sm:block max-w-[120px] truncate">
          {switching
            ? (DEV_ACCOUNTS.find((a) => a.email === switching)?.label ?? "Switching...")
            : currentAccount.label}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 opacity-70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          {/* Overlay closes dropdown on outside click */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
            <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold text-slate-400">
              Pilih Akun Dev
            </div>
            <div className="p-1.5 flex flex-col gap-0.5">
              {DEV_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleSwitch(account.email)}
                  className={`w-full text-left rounded-xl px-3 py-2 text-sm transition-colors ${
                    currentEmail === account.email
                      ? "bg-amber-500/20 text-amber-400 font-medium"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
