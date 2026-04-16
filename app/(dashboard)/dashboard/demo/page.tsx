import Link from "next/link";

import { CollectorListingForm } from "@/components/dashboard/collector-listing-form";
import { LeaderboardCard } from "@/components/dashboard/leaderboard-card";
import { MarketplaceListingsGrid } from "@/components/dashboard/marketplace-listings-grid";
import { MarketplaceOfferList } from "@/components/dashboard/marketplace-offer-list";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { WasteChart } from "@/components/dashboard/waste-chart";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { requireProfile } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function DemoDashboardPage() {
  const profile = await requireProfile();
  const dashboard = await getDashboardData(profile.id);

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
            title="Demo view pickup tetap tersedia"
            message="Halaman ini merangkum konsep baru dalam tampilan demo lintas role tanpa menghilangkan dashboard khusus user, collector, dan admin."
          />
        </section>

        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="emerald" className="w-fit">
              {dashboard.role} demo view
            </Badge>
            <h1 className="text-4xl font-semibold text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              Demo view kini menampilkan alur pickup antara user, collector, dan admin.
            </h1>
            <p className="max-w-3xl text-slate-300">
              User membuat request pickup singkat, sistem melakukan matching dan batching, collector menerima rute,
              lalu admin memantau verifikasi serta transaksi yang selesai.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/user">
              <Button variant="outline">Halaman User</Button>
            </Link>
            <Link href="/dashboard/collector">
              <Button variant="outline">Halaman Collector</Button>
            </Link>
            <Link href="/dashboard/admin">
              <Button variant="outline">Halaman Admin</Button>
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.summary.map((metric) => (
            <SummaryCard key={metric.label} metric={metric} />
          ))}
        </section>

        {dashboard.role === "USER" ? (
          <>
            <section className="mt-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <MarketplaceListingsGrid
                title="Request pickup cepat"
                description="Collector terverifikasi yang siap dipakai saat matching"
                collectors={dashboard.availableCollectors}
                savedAddresses={dashboard.savedAddresses}
              />
              <WasteChart data={dashboard.marketDemand} />
            </section>
            <section className="mt-8">
              <MarketplaceOfferList
                title="Pickup user"
                description="Jejak request pickup yang sudah dibuat user"
                offers={dashboard.myPickups}
              />
            </section>
          </>
        ) : null}

        {dashboard.role === "COLLECTOR" ? (
          <>
            <section className="mt-8">
              <CollectorListingForm batches={dashboard.openBatches} />
            </section>
            <section className="mt-8">
              <MarketplaceOfferList
                title="Pickup collector"
                description="Pickup per titik yang sedang ditangani collector"
                offers={dashboard.myPickups}
                mode="collector"
              />
            </section>
          </>
        ) : null}

        {dashboard.role === "ADMIN" ? (
          <>
            <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <WasteChart data={dashboard.wasteComposition} />
              <LeaderboardCard entries={dashboard.leaderboard} />
            </section>
            <section className="mt-8">
              <MarketplaceOfferList
                title="Pickup terbaru"
                description="Snapshot lintas role"
                offers={dashboard.recentPickups}
              />
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
