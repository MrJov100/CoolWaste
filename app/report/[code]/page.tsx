import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { getPickupByRequestNo } from "@/lib/data/records";
import { Topbar } from "@/components/layout/topbar";
import { ReportForm } from "@/components/report/report-form";
import { titleCase } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Flag } from "lucide-react";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const profile = await requireRole(Role.USER);

  const pickup = await getPickupByRequestNo(code, profile.id);

  if (!pickup || !pickup.collectorId) {
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
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href={`/pickups`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-400" />
              <h1
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                Laporkan Collector
              </h1>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">
              Request{" "}
              <span className="font-mono text-slate-300">#{pickup.requestNo}</span>
              {" · "}
              {titleCase(pickup.wasteType)}
              {pickup.collector && (
                <> · Collector: <span className="text-slate-300">{pickup.collector.name}</span></>
              )}
            </p>
          </div>
        </div>

        <ReportForm
          pickupId={pickup.id}
          pickupRequestNo={pickup.requestNo}
          collectorName={pickup.collector?.name ?? "Collector"}
        />
      </main>
    </div>
  );
}
