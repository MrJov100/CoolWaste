import Link from "next/link";
import { Trophy } from "lucide-react";

import { LeaderboardCard } from "@/components/dashboard/leaderboard-card";
import { Topbar } from "@/components/layout/topbar";
import { DemoChecklistCard } from "@/components/pitch/demo-checklist-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBanner } from "@/components/ui/status-banner";
import { getCurrentProfile } from "@/lib/auth";
import { getPitchDeckData } from "@/lib/data/dashboard";

export default async function LeaderboardPage() {
  const [profile, showcase] = await Promise.all([getCurrentProfile(), getPitchDeckData()]);

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

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <section className="space-y-4">
          <StatusBanner
            tone="success"
            title="Leaderboard publik aktif"
            message="Halaman ini aman dibuka saat presentasi untuk menunjukkan siapa pengguna paling berdampak tanpa perlu masuk ke dashboard admin."
          />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
            <Badge variant="emerald" className="w-fit">
              <Trophy className="mr-2 h-3.5 w-3.5" />
              Public impact board
            </Badge>
            <h1 className="text-4xl font-semibold text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              Leaderboard dampak komunitas Cool Waste
            </h1>
              <p className="max-w-2xl text-slate-300">
                Menampilkan peringkat pengguna berdasarkan total CO2 terselamatkan, berat sampah terkelola, dan nilai
                ekonomi yang dihasilkan.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/showcase">
                <Button variant="outline">Buka Showcase</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary">Buka Dashboard</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <LeaderboardCard entries={showcase.dashboard.leaderboard} />
          <Card>
            <CardHeader>
              <CardDescription>Why it matters</CardDescription>
              <CardTitle>Kenapa leaderboard ini penting</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {[
                "Membuat dampak lingkungan terasa lebih personal dan kompetitif.",
                "Mudah dipakai sebagai bukti engagement komunitas saat pitching.",
                "Bisa jadi fondasi gamification sebelum modul AI dirilis penuh.",
              ].map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-200">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <DemoChecklistCard items={showcase.checklist} compact />
        </section>
      </main>
    </div>
  );
}
