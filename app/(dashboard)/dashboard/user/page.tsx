import Link from "next/link";
import { Role } from "@prisma/client";
import {
  ArrowRight,
  Leaf,
  Package,
  Star,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";

import { PickupAlertDialog } from "@/components/dashboard/pickup-alert-dialog";
import { MarketplaceListingsGrid } from "@/components/dashboard/marketplace-listings-grid";
import { MarketplaceOfferList } from "@/components/dashboard/marketplace-offer-list";
import { WasteChart } from "@/components/dashboard/waste-chart";
import { OpenChatButton } from "@/components/chat/open-chat-button";
import { Topbar } from "@/components/layout/topbar";
import { requireRole } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { getChatThreadsForProfile } from "@/lib/data/chat";

export default async function UserDashboardPage() {
  const profile = await requireRole(Role.USER);
  const [dashboard, chatThreads] = await Promise.all([
    getDashboardData(profile.id),
    getChatThreadsForProfile({ profileId: profile.id, role: Role.USER }),
  ]);

  if (dashboard.role !== "USER") {
    return null;
  }

  const {
    summary,
    myPickups,
    ongoingPickups,
    availableCollectors,
    savedAddresses,
    marketDemand,
  } = dashboard;

  // Build a map: pickupRequestId → chatThreadId (for quick lookup in JSX)
  const pickupThreadMap = new Map(
    chatThreads.map((t) => [t.pickupRequestId, t.id]),
  );

  const summaryIcons = [Package, TrendingUp];
  const summaryColors = [
    "text-blue-400 bg-blue-500/10",
    "text-purple-400 bg-purple-500/10",
  ];

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
        <PickupAlertDialog pickups={myPickups} />

        {/* ── Hero greeting ── */}
        <section className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">
                Selamat datang kembali 👋
              </p>
              <h1
                className="mt-1 text-3xl font-bold text-white sm:text-4xl"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                {profile.name}
              </h1>
              <p className="mt-2 max-w-xl text-slate-400">
                Jual sampah dalam kurang dari 1 menit. Pilih jenis, berat,
                lokasi — sistem otomatis matching ke collector terdekat.
              </p>
            </div>
          </div>
        </section>

        {/* ── Summary metrics (hanya 2: Pickup aktif & Income) ── */}
        <section className="mb-8 grid grid-cols-2 gap-3">
          {summary.map((metric, i) => {
            const Icon = summaryIcons[i] ?? Leaf;
            const colorClass =
              summaryColors[i] ?? "text-slate-400 bg-slate-500/10";
            const [iconColor, bgColor] = colorClass.split(" ");
            return (
              <div
                key={metric.label}
                className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs text-slate-500">{metric.label}</p>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${bgColor}`}
                  >
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{metric.value}</p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {metric.hint}
                </p>
              </div>
            );
          })}
        </section>

        {/* ── Quick links (tanpa Settings) ── */}
        <section className="mb-8 grid grid-cols-3 gap-3">
          {[
            {
              href: "/pickups",
              icon: Package,
              label: "Riwayat Pickup",
              desc: "Pantau status request",
            },
            {
              href: "/transactions",
              icon: Wallet,
              label: "Transaksi",
              desc: "Riwayat pembayaran",
            },
            {
              href: "/ratings",
              icon: Star,
              label: "Rating Saya",
              desc: "Review collector",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-2 rounded-3xl border border-white/10 bg-slate-900/40 p-4 transition-all hover:border-emerald-500/30 hover:bg-slate-900/80"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 transition-all group-hover:bg-emerald-500/15">
                <item.icon className="h-5 w-5 text-slate-400 transition-all group-hover:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-emerald-400" />
            </Link>
          ))}
        </section>

        {/* ── Request Pickup (dominan, full-width) ── */}
        <section className="mb-8">
          <MarketplaceListingsGrid
            title="Buat Request Pickup"
            description="Collector terverifikasi yang siap dijadwalkan via auto matching"
            collectors={availableCollectors}
            savedAddresses={savedAddresses}
          />
        </section>

        {/* ── Ongoing Pickups (dekat Request Pickup) ── */}
        {ongoingPickups.length > 0 && (
          <section className="mb-8">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-amber-400">
                    Sedang Berlangsung
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-white">
                    Pickup Aktif
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-400">
                    Pickup yang masih menunggu atau dalam perjalanan
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10">
                  <Truck className="h-5 w-5 text-amber-400" />
                </div>
              </div>

              {/* Quick chat access per pickup */}
              {ongoingPickups.some((p) => pickupThreadMap.has(p.id)) && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {ongoingPickups.map((pickup) => {
                    const threadId = pickupThreadMap.get(pickup.id);
                    if (!threadId || !pickup.collectorName) return null;
                    return (
                      <div
                        key={pickup.id}
                        className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2"
                      >
                        <span className="text-xs text-slate-400">
                          #{pickup.requestNo} · {pickup.collectorName}
                        </span>
                        <OpenChatButton
                          threadId={threadId}
                          label="Hubungi Collector"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <MarketplaceOfferList
                title=""
                description=""
                offers={ongoingPickups}
                hidePendingCommercials
                compact
              />
            </div>
          </section>
        )}

        {/* ── Waste Chart ── */}
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">
              Statistik
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Komposisi Sampah
            </h2>
            <p className="mt-0.5 text-sm text-slate-400">
              Breakdown jenis sampah yang sudah kamu jual
            </p>
          </div>
          <WasteChart data={marketDemand} />
        </section>
      </main>
    </div>
  );
}
