import Link from "next/link";
import { Role } from "@prisma/client";

import { ChatReportAdminPanel } from "@/components/chat/chat-report-admin-panel";
import { LeaderboardCard } from "@/components/dashboard/leaderboard-card";
import { MarketplaceOfferList } from "@/components/dashboard/marketplace-offer-list";
import { StoryCard } from "@/components/dashboard/story-card";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { WasteChart } from "@/components/dashboard/waste-chart";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBanner } from "@/components/ui/status-banner";
import { verifyCollector } from "@/lib/actions/dashboard";
import { requireRole } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function AdminDashboardPage() {
  const profile = await requireRole(Role.ADMIN);
  const dashboard = await getDashboardData(profile.id);

  if (dashboard.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Topbar
        profile={{
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          saldo: profile.saldo,
          address: profile.address,
        }}
      />

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10">
        <section className="mb-6">
          <StatusBanner
            tone="warning"
            title="Admin memantau operasi pickup"
            message="Admin fokus pada verifikasi collector, kesehatan batching, status pickup, dan transaksi COD yang sudah selesai."
          />
        </section>

        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="emerald" className="w-fit">
              ADMIN operations
            </Badge>
            <h1 className="text-4xl font-semibold text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              Halo, {profile.name}. Pantau kesehatan operasi pickup dari satu panel kontrol.
            </h1>
            <p className="max-w-3xl text-slate-300">
              Admin memantau collector yang menunggu verifikasi, pickup terbaru, transaksi, serta leaderboard dampak
              untuk melihat seberapa aktif ekosistem berlangsung.
            </p>
          </div>
          <Card className="max-w-sm bg-white/[0.04]">
            <CardContent className="p-5">
              <p className="text-sm text-slate-400">Pusat kendali</p>
              <p className="mt-2 text-3xl font-semibold text-white">Pickup control</p>
              <p className="mt-2 text-sm text-slate-400">{profile.email}</p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-6 flex flex-wrap gap-3">
          <Link href="/pickups">
            <Button variant="secondary">Aktivitas Pickup</Button>
          </Link>
          <Link href="/transactions">
            <Button variant="secondary">Audit Transaksi</Button>
          </Link>
          <Link href="/dashboard/demo">
            <Button variant="outline">Demo View</Button>
          </Link>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.summary.map((metric) => (
            <SummaryCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardContent className="grid gap-4 p-6">
              {dashboard.systemHighlights.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                </div>
              ))}
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-400">Collector pending verifikasi</p>
                <div className="mt-3 space-y-3">
                  {dashboard.pendingCollectors.length ? (
                    dashboard.pendingCollectors.map((collector) => (
                      <div key={collector.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                        <p className="font-medium text-white">{collector.name}</p>
                        <p className="text-sm text-slate-400">
                          {collector.serviceAreaLabel ?? collector.address ?? "Area belum diisi"}
                        </p>
                        <form action={verifyCollector.bind(null, collector.id)} className="mt-3">
                          <Button type="submit" variant="outline">
                            Verifikasi collector
                          </Button>
                        </form>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Tidak ada collector yang menunggu verifikasi.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <MarketplaceOfferList
            title="Pickup terbaru seluruh sistem"
            description="Pantau siapa yang membuat request, collector yang menangani, dan status terbarunya"
            offers={dashboard.recentPickups}
          />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <WasteChart data={dashboard.wasteComposition} />
          <LeaderboardCard entries={dashboard.leaderboard} />
        </section>

        <section className="mt-8">
          <ChatReportAdminPanel reports={dashboard.chatReports} />
        </section>

        <section className="mt-8">
          <StoryCard
            title="Pitch-ready insight"
            description="Tiga poin cepat untuk menjelaskan model pickup baru"
            points={dashboard.storyPoints}
          />
        </section>
      </main>
    </div>
  );
}
