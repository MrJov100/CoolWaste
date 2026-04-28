"use server";

import { Role, VerificationState, WasteType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { DEMO_PROFILE_COOKIE } from "@/lib/auth";
import { getDashboardPath, getDefaultWastePricingMap } from "@/lib/constants";
import { getDevAccountByEmail, isDevAccountSwitcherEnabled } from "@/lib/dev-accounts";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter."),
  email: z.string().email("Email belum valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
  role: z.enum(["USER", "COLLECTOR"]),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  serviceAreaLabel: z.string().trim().optional(),
  serviceRadiusKm: z.coerce.number().optional(),
  dailyCapacityKg: z.coerce.number().optional(),
  acceptedWasteTypes: z.array(z.nativeEnum(WasteType)).optional(),
  plasticPrice: z.coerce.number().optional(),
  paperPrice: z.coerce.number().optional(),
  organicPrice: z.coerce.number().optional(),
  metalPrice: z.coerce.number().optional(),
  glassPrice: z.coerce.number().optional(),
});

type AuthActionState = {
  success: boolean;
  message: string;
};

function normalizeOptionalField(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function normalizeOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed.length) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function setSessionCookie(email: string) {
  const cookieStore = await cookies();
  cookieStore.set("cw-session", email, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    // 30-day session
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function signIn(_: AuthActionState, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, message: "Email atau password belum valid." };
  }

  const profile = await db.profile.findUnique({ where: { email: parsed.data.email } });

  if (!profile || !profile.passwordHash) {
    return { success: false, message: "Email atau password salah." };
  }

  const match = await bcrypt.compare(parsed.data.password, profile.passwordHash);
  if (!match) {
    return { success: false, message: "Email atau password salah." };
  }

  await setSessionCookie(profile.email);
  redirect("/dashboard");
}

export async function signUp(_: AuthActionState, formData: FormData) {
  const role = formData.get("role");
  const acceptedWasteTypes = formData
    .getAll("acceptedWasteTypes")
    .filter((value): value is WasteType => typeof value === "string" && value in WasteType);
  const defaultPricing = getDefaultWastePricingMap();

  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role,
    phone: normalizeOptionalField(formData.get("phone")),
    address: normalizeOptionalField(formData.get("address")),
    latitude: normalizeOptionalNumber(formData.get("latitude")),
    longitude: normalizeOptionalNumber(formData.get("longitude")),
    serviceAreaLabel: normalizeOptionalField(formData.get("serviceAreaLabel")),
    serviceRadiusKm: normalizeOptionalNumber(formData.get("serviceRadiusKm")),
    dailyCapacityKg: normalizeOptionalNumber(formData.get("dailyCapacityKg")),
    acceptedWasteTypes,
    plasticPrice: normalizeOptionalNumber(formData.get("plasticPrice")),
    paperPrice: normalizeOptionalNumber(formData.get("paperPrice")),
    organicPrice: normalizeOptionalNumber(formData.get("organicPrice")),
    metalPrice: normalizeOptionalNumber(formData.get("metalPrice")),
    glassPrice: normalizeOptionalNumber(formData.get("glassPrice")),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Data pendaftaran belum valid." };
  }

  if (parsed.data.role === "COLLECTOR") {
    if (!parsed.data.serviceAreaLabel || !parsed.data.serviceRadiusKm || !parsed.data.dailyCapacityKg) {
      return { success: false, message: "Collector wajib mengisi area layanan, radius, dan kapasitas harian." };
    }
    if (!parsed.data.acceptedWasteTypes?.length) {
      return { success: false, message: "Collector wajib memilih minimal satu jenis sampah yang diterima." };
    }
  }

  const existing = await db.profile.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { success: false, message: "Email sudah terdaftar. Silakan login." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const roleValue = parsed.data.role as Role;
  const verificationState = VerificationState.VERIFIED;
  const wastePricing = {
    PLASTIC: parsed.data.plasticPrice ?? defaultPricing.PLASTIC,
    PAPER: parsed.data.paperPrice ?? defaultPricing.PAPER,
    ORGANIC: parsed.data.organicPrice ?? defaultPricing.ORGANIC,
    METAL: parsed.data.metalPrice ?? defaultPricing.METAL,
    GLASS: parsed.data.glassPrice ?? defaultPricing.GLASS,
  };

  const profile = await db.profile.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      name: parsed.data.name,
      role: roleValue,
      phone: parsed.data.phone,
      address: parsed.data.address,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      verificationState,
      serviceAreaLabel: parsed.data.serviceAreaLabel,
      serviceRadiusKm: parsed.data.serviceRadiusKm,
      dailyCapacityKg: parsed.data.dailyCapacityKg,
      wastePricing,
      acceptedWasteTypes: parsed.data.acceptedWasteTypes ?? [],
    },
  });

  if (parsed.data.address) {
    await db.savedAddress.create({
      data: {
        profileId: profile.id,
        label: "Alamat utama",
        address: parsed.data.address,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        isDefault: true,
      },
    });
  }

  await setSessionCookie(profile.email);
  redirect(getDashboardPath(roleValue));
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_PROFILE_COOKIE);
  cookieStore.delete("cw-session");
  redirect("/");
}

export async function switchDevAccount(formData: FormData) {
  if (!isDevAccountSwitcherEnabled()) {
    throw new Error("Dev account switcher hanya aktif saat development.");
  }

  const email = formData.get("email");
  if (typeof email !== "string") {
    throw new Error("Email akun developer tidak valid.");
  }

  const account = getDevAccountByEmail(email);
  if (!account) {
    throw new Error("Akun developer tidak ditemukan.");
  }

  const redirectTo = formData.get("redirectTo");
  const nextPath = typeof redirectTo === "string" && redirectTo.startsWith("/") ? redirectTo : "/dashboard";
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_PROFILE_COOKIE);

  cookieStore.set("cw-session", account.email, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(nextPath);
}
