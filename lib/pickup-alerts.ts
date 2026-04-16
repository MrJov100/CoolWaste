import type { PickupRejectionEntry } from "@/lib/types";

export const COLLECTOR_REJECTION_REASONS = [
  "Sampah terlalu kotor",
  "Jarak terlalu jauh",
  "Foto tidak sesuai kondisi asli",
  "Jenis sampah tidak sesuai",
  "Kapasitas collector sedang penuh",
  "Akses lokasi sulit dijangkau",
  "Jadwal pickup penuh",
] as const;

export const PICKUP_BUSY_MESSAGE = "Pickup sedang sibuk, coba lagi nanti.";

export const PICKUP_TIMEOUT_MINUTES = 10;
export const USER_REJECTION_DECISION_THRESHOLD = 3;

export function parsePickupRejectionHistory(value: unknown): PickupRejectionEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const source = entry as Record<string, unknown>;
    if (
      typeof source.collectorId !== "string" ||
      typeof source.collectorName !== "string" ||
      typeof source.reason !== "string" ||
      typeof source.rejectedAt !== "string"
    ) {
      return [];
    }

    return [
      {
        collectorId: source.collectorId,
        collectorName: source.collectorName,
        reason: source.reason,
        rejectedAt: source.rejectedAt,
      },
    ];
  });
}

export function summarizePickupRejections(entries: PickupRejectionEntry[]) {
  if (!entries.length) {
    return "Beberapa collector belum bisa mengambil pickup ini.";
  }

  const reasonCounts = new Map<string, number>();
  for (const entry of entries) {
    reasonCounts.set(entry.reason, (reasonCounts.get(entry.reason) ?? 0) + 1);
  }

  const summary = Array.from(reasonCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([reason, count]) => (count > 1 ? `${reason} (${count}x)` : reason))
    .join(", ");

  return `Collector menolak pickup ini karena ${summary}.`;
}
