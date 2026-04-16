import Link from "next/link";
import { ArrowRight, Presentation, ShieldCheck } from "lucide-react";

import { LeaderboardCard } from "@/components/dashboard/leaderboard-card";
import { StoryCard } from "@/components/dashboard/story-card";
import { WasteChart } from "@/components/dashboard/waste-chart";
import { Topbar } from "@/components/layout/topbar";
import { DemoChecklistCard } from "@/components/pitch/demo-checklist-card";
import { PresentationToolbar } from "@/components/pitch/presentation-toolbar";
import { ShowcaseHero } from "@/components/pitch/showcase-hero";
import { PitchMetricGrid } from "@/components/pitch/pitch-metric-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBanner } from "@/components/ui/status-banner";
import { getCurrentProfile } from "@/lib/auth";
import { getPitchDeckData } from "@/lib/data/dashboard";

export default async function ShowcasePage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string }>;
}) {
  const [profile, showcase] = await Promise.all([getCurrentProfile(), getPitchDeckData()]);
  const resolvedSearchParams = await searchParams;
  const presentMode = resolvedSearchParams?.mode === "present";

  return (
    <div className="min-h-screen">
      {!presentMode ? (
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
      ) : null}

      <main className={`mx-auto max-w-7xl px-6 pb-24 ${presentMode ? "pt-6" : "pt-10"}`}>
        <PresentationToolbar presentMode={presentMode} />

        <ShowcaseHero />

        <section className="mt-8">
          <StatusBanner
            tone="success"
            title="Pitch mode aktif"
            message="Gunakan halaman ini untuk opening, lalu pindah ke dashboard role switcher dan records page untuk menunjukkan eksekusi end-to-end."
          />
        </section>

        <section className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="slate">
              <Presentation className="mr-2 h-3.5 w-3.5" />
              Fullscreen-friendly pitch
            </Badge>
            <Badge variant="emerald">
              <ShieldCheck className="mr-2 h-3.5 w-3.5" />
              Based on live seeded demo data
            </Badge>
          </div>
          <Link href="/dashboard">
            <Button>
              Kembali ke Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </section>

        <section id="metrics" className="mt-8 scroll-mt-24">
          <PitchMetricGrid metrics={showcase.dashboard.summary} />
        </section>

        <section id="impact" className="mt-8 scroll-mt-24 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <WasteChart data={showcase.dashboard.wasteComposition} />
          <LeaderboardCard entries={showcase.dashboard.leaderboard} />
        </section>

        <section id="story" className="mt-8 scroll-mt-24 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <StoryCard
            title="Narasi pitch utama"
            description="Bisa dibacakan langsung saat menjelaskan manfaat platform"
            points={showcase.dashboard.storyPoints}
          />

          <Card>
            <CardHeader>
              <CardDescription>Quick snapshot</CardDescription>
              <CardTitle>Kenapa platform ini siap dipresentasikan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {showcase.landing.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.hint}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <Card className="border-amber-300/15 bg-[linear-gradient(135deg,rgba(245,158,11,0.10),rgba(15,23,42,0.92))]">
            <CardHeader>
              <CardDescription>Presentation flow</CardDescription>
              <CardTitle>Alur demo 60 detik</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {[
                "Tunjukkan metrik utama untuk membangun konteks masalah dan dampak.",
                "Buka dashboard role switcher untuk memperlihatkan alur user, collector, lalu admin.",
                "Tutup dengan leaderboard dan story points sebagai bukti produk siap berkembang ke modul AI.",
              ].map((item, index) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-amber-200">Step {index + 1}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-200">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <DemoChecklistCard items={showcase.checklist} compact={presentMode} />
        </section>
      </main>
    </div>
  );
}
