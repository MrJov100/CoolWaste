import Link from "next/link";
import { Role } from "@prisma/client";
import { ArrowLeft } from "lucide-react";

import { MarketplaceOfferList } from "@/components/dashboard/marketplace-offer-list";
import { Topbar } from "@/components/layout/topbar";
import { requireRole } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function CollectorActivityPage() {
  const profile = await requireRole(Role.COLLECTOR);
  const dashboard = await getDashboardData(profile.id);

  if (dashboard.role !== "COLLECTOR") return null;

  return (
    <div className="min-h-screen bg-slate-950">
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

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/dashboard/collector"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-400 transition-all hover:border-white/20 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </div>

        <section>
          <div className="mb-2">
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Pickup Activity</p>
            <h1
              className="mt-1 text-2xl font-bold text-white"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Riwayat Pickup Saya
            </h1>
            <p className="mt-1 text-sm text-slate-400">Semua pickup per titik yang pernah atau sedang ditangani</p>
          </div>
        </section>

        <section className="mt-6">
          <MarketplaceOfferList
            title="Semua Pickup"
            description="Selesaikan pickup setelah rute dimulai"
            offers={dashboard.myPickups}
            mode="collector"
          />
        </section>
      </main>
    </div>
  );
}
