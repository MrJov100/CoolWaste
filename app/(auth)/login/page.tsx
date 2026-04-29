import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Leaf,
  LogIn,
  Recycle,
  Shield,
  Star,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";

import { signIn } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { FormState } from "@/components/ui/form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950">

      {/* ── Slim navbar ── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-400">
              <Leaf className="h-5 w-5" />
            </div>
            <span
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              CoolWaste
            </span>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="gap-2">
              Daftar Sekarang
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Main grid ── */}
      <main className="mx-auto grid min-h-[calc(100vh-57px)] max-w-7xl items-stretch px-6 lg:grid-cols-[1.1fr_auto_0.9fr]">

        {/* ── Left: Branding ── */}
        <div className="relative flex flex-col justify-center py-16 pr-0 lg:pr-16">
          <div className="pointer-events-none absolute -left-20 top-1/4 -z-10 h-80 w-80 rounded-full bg-emerald-600/15 blur-[120px]" />
          <div className="pointer-events-none absolute left-1/3 top-2/3 -z-10 h-64 w-64 rounded-full bg-teal-600/10 blur-[100px]" />

          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
              <Recycle className="h-4 w-4" />
              Selamat Datang Kembali
            </div>

            <div className="space-y-4">
              <h1
                className="text-4xl font-bold leading-tight text-white md:text-5xl"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                Lanjutkan Perjalanan{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Hijaumu
                </span>{" "}
                Bersama Kami
              </h1>
              <p className="max-w-lg text-lg leading-8 text-slate-400">
                Akses dashboard, cek status pickup, dan pantau saldo penjualan sampah
                daur ulangmu — semua di satu tempat.
              </p>
            </div>

            <ul className="space-y-3">
              {[
                { icon: Zap, text: "Matching otomatis dengan collector terdekat" },
                { icon: Truck, text: "Status pickup real-time & riwayat transaksi" },
                { icon: Wallet, text: "Saldo COD tercatat transparan per pickup" },
                { icon: CheckCircle2, text: "Leaderboard CO₂ komunitas yang kamu dampaki" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-slate-300">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm">{text}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-slate-300 italic">
                "Sebelum pakai CoolWaste, saya harus keliling dua RT buat cari
                pengepul. Sekarang tinggal buka hp, 10 menit pengepul udah di depan
                pintu."
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-emerald-950">
                  SR
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Siti Rahayu</p>
                  <p className="text-xs text-slate-500">Pengguna aktif · Bandung</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden w-px self-stretch border-l border-white/[0.06] lg:block" />

        {/* ── Right: Form ── */}
        <div className="flex flex-col justify-center pb-16 pt-0 lg:py-16 lg:pl-16">
          <div className="w-full max-w-md space-y-8">

            <div className="space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <LogIn className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
                Akun CoolWaste
              </p>
              <h2
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                Masuk ke Dashboard
              </h2>
              <p className="text-sm text-slate-400">
                Belum punya akun?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-emerald-400 underline-offset-4 hover:underline"
                >
                  Daftar gratis di sini
                </Link>
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
              <FormState action={signIn} submitLabel="Masuk Sekarang">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="budi@example.com"
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-slate-600 focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-slate-600 focus:border-emerald-500/50"
                  />
                </div>
              </FormState>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              Autentikasi aman · Password dienkripsi dengan bcrypt
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
