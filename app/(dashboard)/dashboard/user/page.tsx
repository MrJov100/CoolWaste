import Link from "next/link";
import { Role } from "@prisma/client";

import { HighlightGrid } from "@/components/dashboard/highlight-grid";
import { PickupAlertDialog } from "@/components/dashboard/pickup-alert-dialog";
import { MarketplaceListingsGrid } from "@/components/dashboard/marketplace-listings-grid";
import { MarketplaceOfferList } from "@/components/dashboard/marketplace-offer-list";
import { StoryCard } from "@/components/dashboard/story-card";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { WasteChart } from "@/components/dashboard/waste-chart";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBanner } from "@/components/ui/status-banner";
import { requireRole } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatCurrency } from "@/lib/utils";

export default async function UserDashboardPage() {
  const profile = await requireRole(Role.USER);
  const dashboard = await getDashboardData(profile.id);

  if (dashboard.role !== "USER") {
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
        <PickupAlertDialog pickups={dashboard.myPickups} />
        <section className="mb-6">
          <StatusBanner
            tone="info"
            title="Mode pickup user aktif"
            message="User cukup pilih jenis sampah, estimasi berat, alamat, dan slot waktu. Sistem akan auto matching ke collector terdekat lalu menggabungkannya ke batch pickup yang efisien."
          />
        </section>

        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="emerald" className="w-fit">
              USER pickup flow
            </Badge>
            <h1 className="text-4xl font-semibold text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              Halo, {profile.name}. Jual sampahmu cepat, lalu biarkan sistem mengatur matching dan batching.
            </h1>
            <p className="max-w-3xl text-slate-300">
              Form dibuat singkat untuk request pickup kurang dari satu menit, sementara status pickup tetap transparan dari menunggu matching sampai selesai dibayar.
            </p>
          </div>
        </section>

        <section className="mt-6 flex flex-wrap gap-3">
          <Link href="/pickups">
            <Button variant="secondary">Aktivitas Pickup</Button>
          </Link>
          <Link href="/transactions">
            <Button variant="secondary">Riwayat Transaksi</Button>
          </Link>
          <Link href="/dashboard/demo">
            <Button variant="outline">Buka Demo View</Button>
          </Link>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.summary.map((metric) => (
            <SummaryCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="mt-8">
          <MarketplaceListingsGrid
            title="Buat request pickup"
            description="Collector yang terverifikasi dan siap dipakai untuk auto matching"
            collectors={dashboard.availableCollectors}
            savedAddresses={dashboard.savedAddresses}
          />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <MarketplaceOfferList
            title="Request pickup saya"
            description="Pantau pickup yang masih menunggu matching, sudah dijadwalkan, atau selesai dibayar"
            offers={dashboard.myPickups}
            hidePendingCommercials
          />
          <WasteChart data={dashboard.marketDemand} />
        </section>

        <section className="mt-8">
          <HighlightGrid
            title="Ringkasan pickup"
            description="Sorotan cepat agar user tahu kondisi request mereka"
            items={dashboard.marketplaceHighlights}
          />
        </section>

        <section className="mt-8">
          <StoryCard
            title="Progress pengguna"
            description="Poin singkat yang membuat perjalanan pickup terasa jelas"
            points={dashboard.achievements}
          />
        </section>
      </main>
    </div>
  );
}
