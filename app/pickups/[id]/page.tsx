import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { ArrowLeft, Package } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { OpenChatButton } from "@/components/chat/open-chat-button";
import { PickupDetailCard } from "@/components/records/pickup-detail-card";
import { requireProfile } from "@/lib/auth";
import { getChatThreadForPickup } from "@/lib/data/chat";
import { getPickupDetailForProfile } from "@/lib/data/records";

export default async function PickupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const pickup = await getPickupDetailForProfile({
    pickupId: id,
    profileId: profile.id,
    role: profile.role,
  });
  const chatThread = await getChatThreadForPickup({
    pickupId: id,
    profileId: profile.id,
    role: profile.role,
  });

  if (!pickup) {
    notFound();
  }

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

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
        {/* Header */}
        <section className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/pickups"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-slate-400 transition-all hover:border-white/20 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-400" />
                <h1
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "var(--font-sora), sans-serif" }}
                >
                  Detail Pickup
                </h1>
              </div>
              <p className="mt-0.5 text-sm text-slate-400">#{pickup.requestNo}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {chatThread ? (
              <OpenChatButton
                threadId={chatThread.id}
                label="Buka Chat"
                className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-950/20 px-4 py-2.5 text-sm text-amber-300 transition-all hover:bg-amber-950/40"
              />
            ) : null}
            <Link
              href="/pickups"
              className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 transition-all hover:border-white/20 hover:text-slate-200"
            >
              Kembali ke Riwayat
            </Link>
          </div>
        </section>

        <PickupDetailCard
          pickup={pickup}
          canNavigate={profile.role === Role.COLLECTOR}
          hidePendingCommercials={profile.role === Role.USER}
        />
      </main>
    </div>
  );
}
