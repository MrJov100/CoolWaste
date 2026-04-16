import Link from "next/link";
import { Role, VerificationState } from "@prisma/client";

import { CollectorListingForm } from "@/components/dashboard/collector-listing-form";
import { HighlightGrid } from "@/components/dashboard/highlight-grid";
import { MarketplaceOfferList } from "@/components/dashboard/marketplace-offer-list";
import { CollectorReviewCard } from "@/components/dashboard/collector-review-card";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBanner } from "@/components/ui/status-banner";
import { requireRole } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function CollectorDashboardPage() {
  const profile = await requireRole(Role.COLLECTOR);
  const dashboard = await getDashboardData(profile.id);

  if (dashboard.role !== "COLLECTOR") {
    return null;
  }

  const verificationPending = profile.verificationState !== VerificationState.VERIFIED;

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
            tone={verificationPending ? "warning" : "info"}
            title={verificationPending ? "Collector menunggu verifikasi admin" : "Mode collector batching aktif"}
            message={
              verificationPending
                ? "Akun collector belum ikut matching otomatis sampai admin memverifikasi area layanan, jenis sampah, harga, dan kapasitas harian."
                : "Collector menerima pickup dalam bentuk batch per area dan slot waktu, lalu memproses tiap titik hingga selesai dibayar."
            }
          />
        </section>

        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="emerald" className="w-fit">
              COLLECTOR batch flow
            </Badge>
            <h1 className="text-4xl font-semibold text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              Halo, {profile.name}. Terima rute, jalankan pickup, lalu selesaikan pembayaran dari satu dashboard.
            </h1>
            <p className="max-w-3xl text-slate-300">
              Fokus collector sekarang bukan review request satu-satu, tetapi menerima batch pickup yang sudah dikurasi sistem berdasarkan area, slot, dan kapasitas.
            </p>
          </div>
          <Card className="max-w-sm bg-white/[0.04]">
            <CardContent className="p-5">
              <p className="text-sm text-slate-400">Area layanan aktif</p>
              <p className="mt-2 text-3xl font-semibold text-white">{profile.serviceAreaLabel ?? "Belum diisi"}</p>
              <p className="mt-2 text-sm text-slate-400">{profile.email}</p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-6 flex flex-wrap gap-3">
          <Link href="/pickups">
            <Button variant="secondary">Semua Pickup Saya</Button>
          </Link>
          <Link href="/transactions">
            <Button variant="secondary">Riwayat Transaksi</Button>
          </Link>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.summary.map((metric) => (
            <SummaryCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <CollectorListingForm batches={dashboard.openBatches} />
          <HighlightGrid
            title="Collector mission board"
            description="Kapasitas dan area layanan yang memengaruhi auto matching"
            items={dashboard.serviceHighlights}
          />
        </section>

        <section className="mt-8">
          <MarketplaceOfferList
            title="Pickup saya"
            description="Lihat pickup per titik dan selesaikan pembayaran setelah timbang di lokasi"
            offers={dashboard.myPickups}
            mode="collector"
          />
        </section>

        <section className="mt-8">
          <CollectorReviewCard
            ratingAverage={dashboard.ratingAverage}
            ratingCount={dashboard.ratingCount}
            reviews={dashboard.recentReviews}
          />
        </section>
      </main>
    </div>
  );
}
