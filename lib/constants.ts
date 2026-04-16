import { BatchStatus, PickupSlot, PickupStatus, Role, WasteType } from "@prisma/client";

export const PRICE_PER_KG = {
  plastic: 3000,
  paper: 2000,
  organic: 1000,
  metal: 5000,
  glass: 1500,
} as const;

export const CO2_PER_KG = {
  plastic: 1.5,
  paper: 1,
  organic: 0.5,
  metal: 2,
  glass: 0.8,
} as const;

export const WASTE_TYPE_OPTIONS = Object.keys(PRICE_PER_KG) as Array<keyof typeof PRICE_PER_KG>;

export type WastePricingMap = Record<WasteType, number>;

export const PICKUP_SLOT_OPTIONS: PickupSlot[] = [PickupSlot.PAGI, PickupSlot.SIANG, PickupSlot.SORE];

export function calculatePrice(type: keyof typeof PRICE_PER_KG, weight: number) {
  return Math.round(PRICE_PER_KG[type] * weight);
}

export function calculateCO2(type: keyof typeof CO2_PER_KG, weight: number) {
  return Number((CO2_PER_KG[type] * weight).toFixed(2));
}

export function getDefaultWastePricingMap(): WastePricingMap {
  return {
    PLASTIC: PRICE_PER_KG.plastic,
    PAPER: PRICE_PER_KG.paper,
    ORGANIC: PRICE_PER_KG.organic,
    METAL: PRICE_PER_KG.metal,
    GLASS: PRICE_PER_KG.glass,
  };
}

export function normalizeWastePricingMap(input?: unknown): WastePricingMap {
  const fallback = getDefaultWastePricingMap();

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fallback;
  }

  const source = input as Record<string, unknown>;

  return {
    PLASTIC: typeof source.PLASTIC === "number" ? source.PLASTIC : fallback.PLASTIC,
    PAPER: typeof source.PAPER === "number" ? source.PAPER : fallback.PAPER,
    ORGANIC: typeof source.ORGANIC === "number" ? source.ORGANIC : fallback.ORGANIC,
    METAL: typeof source.METAL === "number" ? source.METAL : fallback.METAL,
    GLASS: typeof source.GLASS === "number" ? source.GLASS : fallback.GLASS,
  };
}

export const ROLE_LABEL = {
  USER: "User",
  COLLECTOR: "Collector",
  ADMIN: "Admin",
} as const;

export const PICKUP_SLOT_LABEL: Record<PickupSlot, string> = {
  PAGI: "Pagi (08.00-11.00)",
  SIANG: "Siang (11.00-14.00)",
  SORE: "Sore (14.00-17.00)",
};

export const PICKUP_STATUS_LABEL: Record<PickupStatus, string> = {
  MENUNGGU_MATCHING: "Menunggu matching",
  TERJADWAL: "Terjadwal",
  DALAM_PERJALANAN: "Dalam perjalanan",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export const BATCH_STATUS_LABEL: Record<BatchStatus, string> = {
  MENUNGGU_KONFIRMASI: "Menunggu konfirmasi",
  TERJADWAL: "Terjadwal",
  DALAM_PERJALANAN: "Dalam perjalanan",
  SELESAI: "Selesai",
  DITOLAK: "Ditolak",
};

export function getDashboardPath(role: Role) {
  if (role === Role.COLLECTOR) {
    return "/dashboard/collector";
  }

  if (role === Role.ADMIN) {
    return "/dashboard/admin";
  }

  return "/dashboard/user";
}
