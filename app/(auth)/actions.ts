"use server";

import { Role, VerificationState, WasteType } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { DEMO_PROFILE_COOKIE } from "@/lib/auth";
import { getDashboardPath, getDefaultWastePricingMap } from "@/lib/constants";
import { getDevAccountByEmail, isDevAccountSwitcherEnabled } from "@/lib/dev-accounts";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function normalizeOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed.length) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function signIn(_: AuthActionState, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Email atau password belum valid.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

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
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Data pendaftaran belum valid.",
    };
  }

  if (parsed.data.role === "COLLECTOR") {
    if (!parsed.data.serviceAreaLabel || !parsed.data.serviceRadiusKm || !parsed.data.dailyCapacityKg) {
      return {
        success: false,
        message: "Collector wajib mengisi area layanan, radius, dan kapasitas harian.",
      };
    }

    if (!parsed.data.acceptedWasteTypes?.length) {
      return {
        success: false,
        message: "Collector wajib memilih minimal satu jenis sampah yang diterima.",
      };
    }
  }

  const supabase = await createClient();
  const roleValue = parsed.data.role as Role;
  const verificationState = VerificationState.VERIFIED;
  const wastePricing = {
    PLASTIC: parsed.data.plasticPrice ?? defaultPricing.PLASTIC,
    PAPER: parsed.data.paperPrice ?? defaultPricing.PAPER,
    ORGANIC: parsed.data.organicPrice ?? defaultPricing.ORGANIC,
    METAL: parsed.data.metalPrice ?? defaultPricing.METAL,
    GLASS: parsed.data.glassPrice ?? defaultPricing.GLASS,
  };
  const emailRedirectTo = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    : undefined;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.name,
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
      acceptedWasteTypes: parsed.data.acceptedWasteTypes,
    },
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  if (data.user) {
    const profile = await db.profile.upsert({
      where: { email: parsed.data.email },
      update: {
        authUserId: data.user.id,
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
      create: {
        authUserId: data.user.id,
        email: parsed.data.email,
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
  }

  // Immediately sign in after creation to maintain session flow
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (!signInError) {
    redirect(getDashboardPath(roleValue));
  }

  return {
    success: true,
    message: "Akun berhasil dibuat. Cek email untuk verifikasi jika diminta Supabase.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
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

  const supabase = await createClient();
  await supabase.auth.signOut();

  const { error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });

  if (error) {
    throw new Error(`Gagal pindah ke ${account.label}: ${error.message}`);
  }

  redirect(nextPath);
}
