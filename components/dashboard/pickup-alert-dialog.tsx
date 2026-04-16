"use client";

import {
  cancelPickupAfterRejections,
  continuePickupAfterRejections,
  dismissPickupAlert,
} from "@/lib/actions/dashboard";
import type { PickupRequestCard } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function PickupAlertDialog({ pickups }: { pickups: PickupRequestCard[] }) {
  const pendingAlerts = pickups.filter(
    (pickup) => pickup.userAlertType && (!pickup.userAlertAcknowledgedAt || pickup.requiresUserDecision),
  );
  const activePickup = pendingAlerts[0];

  if (!activePickup) {
    return null;
  }

  const title =
    activePickup.userAlertType === "REJECTION_SUMMARY"
      ? "Beberapa collector menolak pickup ini"
      : "Pickup sedang sibuk";

  const message =
    activePickup.userAlertMessage ??
    (activePickup.userAlertType === "REJECTION_SUMMARY"
      ? "Beberapa collector belum bisa mengambil pickup ini."
      : "Pickup sedang sibuk, coba lagi nanti.");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Sweet Alert</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">{message}</p>

        {activePickup.requiresUserDecision ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={continuePickupAfterRejections.bind(null, activePickup.id)}>
              <Button type="submit">Tunggu</Button>
            </form>
            <form action={cancelPickupAfterRejections.bind(null, activePickup.id)}>
              <Button type="submit" variant="outline">Batalkan</Button>
            </form>
          </div>
        ) : (
          <div className="mt-6 flex justify-end">
            <form action={dismissPickupAlert.bind(null, activePickup.id)}>
              <Button type="submit" variant="outline">Tutup</Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
