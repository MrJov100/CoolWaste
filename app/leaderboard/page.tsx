import Link from "next/link";
import { CheckCircle2, Leaf, Recycle, Trophy, Users, Zap } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import { getLeaderboardData } from "@/lib/data/dashboard";

const MEDAL_STYLES = [
  { bg: "bg-amber-400/15", text: "text-amber-300", border: "border-amber-400/30", label: "🥇" },
  { bg: "bg-slate-300/10", text: "text-slate-300", border: "border-slate-300/20", label: "🥈" },
  { bg: "bg-orange-400/10", text: "text-orange-300", border: "border-orange-400/20", label: "🥉" },
];

/** "Budi Santoso" → "Budi S***" */
function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    const name = parts[0];
    if (name.length <= 3) return name[0] + "***";
    return name.slice(0, 3) + "***";
  }
  const first = parts[0];
  const rest = parts
    .slice(1)
    .map((p) => p[0] + "***")
    .join(" ");
  return `${first} ${rest}`;
}

export default async function LeaderboardPage() {
  const [profile, data] = await Promise.all([
    getCurrentProfile(),
    getLeaderboardData(),
  ]);

  const { leaderboard, totalWeight, totalPickups } = data;
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const co2Saved = (totalWeight * 2.5).toFixed(0);

  return (
    <div className="min-h-screen">
      <Topbar
        profile={
          profile
            ? {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                saldo: profile.saldo,
                address: profile.address,
              }
            : null
        }
      />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-emerald-600/10 blur-[120px]" />
          <div className="absolute right-1/4 top-10 h-64 w-64 rounded-full bg-amber-500/[0.08] blur-[100px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
            <Trophy className="h-4 w-4" />
            Papan Dampak Komunitas
          </div>
          <h1
            className="mt-4 text-4xl font-bold leading-tight text-white md:text-5xl"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Siapa yang Paling{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Berdampak
            </span>
            ?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Setiap kg sampah yang kamu jual lewat CoolWaste mengurangi emisi CO₂ dan
            masuk ke peringkat komunitas ini.
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs text-slate-600">
            Nama peserta ditampilkan sebagian untuk menjaga privasi.
          </p>

          {/* Global stats */}
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4">
            {[
              { icon: Recycle, label: "Total Sampah", value: `${totalWeight.toFixed(0)} kg` },
              { icon: Zap, label: "CO₂ Dikurangi", value: `${co2Saved} kg` },
              { icon: CheckCircle2, label: "Pickup Selesai", value: `${totalPickups}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5">
                <Icon className="mx-auto mb-2 h-5 w-5 text-emerald-400" />
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-12">

        {/* ── Top 3 podium ── */}
        {top3.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-slate-500">
              Peringkat Teratas
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {top3.map((entry, i) => {
                const style = MEDAL_STYLES[i];
                const co2 = (entry.totalWeight * 2.5).toFixed(1);
                return (
                  <div
                    key={entry.id}
                    className={`rounded-2xl border ${style.border} ${style.bg} p-6 text-center`}
                  >
                    <span className="mb-3 block text-3xl">{style.label}</span>
                    <p className={`text-lg font-bold ${style.text}`}>{maskName(entry.name)}</p>
                    <div className="mt-4 space-y-1">
                      <p className="text-2xl font-bold text-white">{entry.totalWeight.toFixed(1)} kg</p>
                      <p className="text-xs text-slate-400">sampah dikelola</p>
                    </div>
                    <div className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
                      ~{co2} kg CO₂ dikurangi
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Full rankings ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
              Semua Peringkat
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Users className="h-3.5 w-3.5" />
              {leaderboard.length} peserta
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-16 text-center">
              <Leaf className="mx-auto mb-3 h-10 w-10 text-slate-700" />
              <p className="text-slate-400">Belum ada data. Jadilah yang pertama!</p>
              <Link href="/signup" className="mt-4 inline-block">
                <Button size="sm">Daftar Sekarang</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              {/* Header */}
              <div className="grid grid-cols-[3rem_1fr_auto_auto] items-center gap-4 border-b border-white/10 bg-white/[0.02] px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-600">
                <span>#</span>
                <span>Peserta</span>
                <span className="text-right">Berat Sampah</span>
                <span className="text-right">CO₂ Dikurangi</span>
              </div>

              {top3.map((entry, i) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-[3rem_1fr_auto_auto] items-center gap-4 border-b border-white/[0.06] bg-emerald-500/[0.03] px-5 py-4 transition-colors hover:bg-white/[0.03]"
                >
                  <span className="text-lg">{MEDAL_STYLES[i].label}</span>
                  <p className="font-semibold text-white">{maskName(entry.name)}</p>
                  <p className="text-right font-semibold text-emerald-300">
                    {entry.totalWeight.toFixed(1)} kg
                  </p>
                  <p className="text-right text-sm text-slate-400">
                    ~{(entry.totalWeight * 2.5).toFixed(1)} kg
                  </p>
                </div>
              ))}

              {rest.map((entry, i) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-[3rem_1fr_auto_auto] items-center gap-4 border-b border-white/[0.06] px-5 py-4 last:border-0 transition-colors hover:bg-white/[0.03]"
                >
                  <span className="text-sm font-medium text-slate-600">#{i + 4}</span>
                  <p className="text-sm font-medium text-white">{maskName(entry.name)}</p>
                  <p className="text-right text-sm font-medium text-slate-300">
                    {entry.totalWeight.toFixed(1)} kg
                  </p>
                  <p className="text-right text-sm text-slate-500">
                    ~{(entry.totalWeight * 2.5).toFixed(1)} kg
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── CTA ── */}
        {!profile && (
          <section className="mt-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
            <Trophy className="mx-auto mb-3 h-8 w-8 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Masuk ke Papan Peringkat</h3>
            <p className="mt-2 text-sm text-slate-400">
              Daftar sekarang dan mulai jual sampah daur ulangmu. Setiap kg sampah
              dihitung dan ditampilkan di sini.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link href="/signup">
                <Button>Daftar Gratis</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Sudah Punya Akun</Button>
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
