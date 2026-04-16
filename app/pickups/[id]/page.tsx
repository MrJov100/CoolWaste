import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { PackageSearch } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { PickupChatPanel } from "@/components/chat/pickup-chat-panel";
import { PickupDetailCard } from "@/components/records/pickup-detail-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Badge variant="emerald" className="w-fit">
              <PackageSearch className="mr-2 h-3.5 w-3.5" />
              Pickup detail
            </Badge>
            <h1 className="text-4xl font-semibold text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              Detail request pickup
            </h1>
            <p className="max-w-2xl text-slate-300">
              Satu record pickup menampilkan user, collector yang menangani, lokasi, slot, foto referensi, dan hasil
              penimbangan akhir.
            </p>
          </div>
          <div className="flex gap-3">
            {chatThread ? (
              <Link href="#pickup-chat">
                <Button variant="secondary">Buka Chat</Button>
              </Link>
            ) : null}
            <Link href="/transactions">
              <Button variant="outline">Lihat transaksi</Button>
            </Link>
            <Link href="/pickups">
              <Button variant="secondary">Kembali ke Aktivitas</Button>
            </Link>
          </div>
        </section>

        <PickupDetailCard
          pickup={pickup}
          canNavigate={profile.role === Role.COLLECTOR}
          hidePendingCommercials={profile.role === Role.USER}
        />
        <PickupChatPanel thread={chatThread} profile={profile} />
      </main>
    </div>
  );
}
