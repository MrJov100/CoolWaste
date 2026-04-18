"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Clock,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  Star,
  Trophy,
  User,
  X,
} from "lucide-react";

import { signOut } from "@/app/(auth)/actions";

// ─── User Dropdown ──────────────────────────────────────────────────────────

type NavUserDropdownProps = {
  name: string;
  role: string;
  unreadChats?: number;
};

export function NavUserDropdown({ name, role, unreadChats = 0 }: NavUserDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-white/[0.10]"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-emerald-950">
          {initials}
        </span>
        <span className="hidden max-w-[120px] truncate sm:block">{name}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
            {/* Header */}
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">{role}</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-white">{name}</p>
            </div>

            {/* Menu Items */}
            <nav className="p-1.5">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Pengaturan
              </Link>
              <Link
                href="/pickups"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Clock className="h-4 w-4 text-slate-400" />
                Riwayat Pickup
                {unreadChats > 0 && (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-emerald-950">
                    {unreadChats}
                  </span>
                )}
              </Link>
              <Link
                href="/ratings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Star className="h-4 w-4 text-slate-400" />
                Rating Pickup
              </Link>
              <Link
                href="/transactions"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Trophy className="h-4 w-4 text-slate-400" />
                Transaksi
              </Link>
            </nav>

            {/* Logout */}
            <div className="border-t border-white/10 p-1.5">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Mobile Navigation ───────────────────────────────────────────────────────

type MobileNavProps = {
  isLoggedIn: boolean;
  name?: string;
  role?: string;
  unreadChats?: number;
};

export function MobileNav({ isLoggedIn, name, role, unreadChats = 0 }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
        aria-label="Buka menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={close} />
          <div className="absolute left-0 right-0 top-full z-50 border-b border-white/10 bg-slate-950/98 px-5 py-4 shadow-2xl backdrop-blur-xl">
            {/* Logo row */}
            <Link href="/" onClick={close} className="mb-4 flex items-center gap-2.5 text-white">
              <div className="rounded-xl bg-emerald-500/15 p-1.5 text-emerald-400">
                <Leaf className="h-4 w-4" />
              </div>
              <span className="font-bold tracking-tight">CoolWaste</span>
            </Link>

            {isLoggedIn ? (
              <nav className="space-y-1">
                {name && role && (
                  <div className="mb-3 rounded-xl bg-white/5 px-4 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">{role}</p>
                    <p className="text-sm font-semibold text-white">{name}</p>
                  </div>
                )}
                <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={close} />
                <NavItem
                  href="/chat"
                  icon={MessageCircle}
                  label="Chat"
                  badge={unreadChats}
                  onClick={close}
                />
                <NavItem href="/leaderboard" icon={Trophy} label="Leaderboard" onClick={close} />
                <NavItem href="/settings" icon={Settings} label="Pengaturan" onClick={close} />
                <NavItem href="/pickups" icon={Clock} label="Riwayat Pickup" onClick={close} />
                <NavItem href="/ratings" icon={Star} label="Rating Pickup" onClick={close} />
                <NavItem href="/transactions" icon={Trophy} label="Transaksi" onClick={close} />

                <div className="pt-2">
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </form>
                </div>
              </nav>
            ) : (
              <nav className="space-y-2">
                <NavItem href="/leaderboard" icon={Trophy} label="Leaderboard" onClick={close} />
                <Link
                  href="/login"
                  onClick={close}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
                >
                  <User className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={close}
                  className="flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
                >
                  Daftar Sekarang
                </Link>
              </nav>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Reusable nav item ───────────────────────────────────────────────────────

function NavItem({
  href,
  icon: Icon,
  label,
  badge = 0,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
    >
      <Icon className="h-4 w-4 text-slate-400" />
      {label}
      {badge > 0 && (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-emerald-950">
          {badge}
        </span>
      )}
    </Link>
  );
}
