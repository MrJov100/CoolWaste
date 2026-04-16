import { Role, VerificationState, WasteType } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDashboardPath } from "@/lib/constants";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const DEMO_PROFILE_COOKIE = "cool-waste-demo-email";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profileByAuthId = await db.profile.findUnique({
      where: { authUserId: user.id },
    });

    const profileByEmail = user.email
      ? await db.profile.findUnique({
          where: { email: user.email },
        })
      : null;

    const metadataRole = user.user_metadata.role;
    const fallbackRole = profileByAuthId?.role ?? profileByEmail?.role ?? Role.USER;
    const role =
      metadataRole === Role.ADMIN || metadataRole === Role.COLLECTOR || metadataRole === Role.USER
        ? metadataRole
        : fallbackRole;

    const metadataVerificationState = user.user_metadata.verificationState;
    const profilePayload = {
      authUserId: user.id,
      email: user.email ?? `${user.id}@smartwaste.local`,
      name: user.user_metadata.full_name ?? profileByAuthId?.name ?? profileByEmail?.name ?? user.email?.split("@")[0] ?? "Cool Waste User",
      role,
      phone:
        typeof user.user_metadata.phone === "string"
          ? user.user_metadata.phone
          : profileByAuthId?.phone ?? profileByEmail?.phone ?? undefined,
      address:
        typeof user.user_metadata.address === "string"
          ? user.user_metadata.address
          : profileByAuthId?.address ?? profileByEmail?.address ?? undefined,
      latitude:
        typeof user.user_metadata.latitude === "number"
          ? user.user_metadata.latitude
          : profileByAuthId?.latitude ?? profileByEmail?.latitude ?? undefined,
      longitude:
        typeof user.user_metadata.longitude === "number"
          ? user.user_metadata.longitude
          : profileByAuthId?.longitude ?? profileByEmail?.longitude ?? undefined,
      verificationState:
        metadataVerificationState === VerificationState.PENDING ||
        metadataVerificationState === VerificationState.VERIFIED ||
        metadataVerificationState === VerificationState.REJECTED
          ? metadataVerificationState
          : profileByAuthId?.verificationState ?? profileByEmail?.verificationState ?? VerificationState.VERIFIED,
      serviceAreaLabel:
        typeof user.user_metadata.serviceAreaLabel === "string"
          ? user.user_metadata.serviceAreaLabel
          : profileByAuthId?.serviceAreaLabel ?? profileByEmail?.serviceAreaLabel ?? undefined,
      serviceRadiusKm:
        typeof user.user_metadata.serviceRadiusKm === "number"
          ? user.user_metadata.serviceRadiusKm
          : profileByAuthId?.serviceRadiusKm ?? profileByEmail?.serviceRadiusKm ?? undefined,
      dailyCapacityKg:
        typeof user.user_metadata.dailyCapacityKg === "number"
          ? user.user_metadata.dailyCapacityKg
          : profileByAuthId?.dailyCapacityKg ?? profileByEmail?.dailyCapacityKg ?? undefined,
      wastePricing:
        user.user_metadata.wastePricing && typeof user.user_metadata.wastePricing === "object"
          ? user.user_metadata.wastePricing
          : profileByAuthId?.wastePricing ?? profileByEmail?.wastePricing ?? undefined,
      acceptedWasteTypes:
        Array.isArray(user.user_metadata.acceptedWasteTypes)
          ? user.user_metadata.acceptedWasteTypes.filter((value: unknown): value is WasteType => typeof value === "string" && value in WasteType)
          : profileByAuthId?.acceptedWasteTypes ?? profileByEmail?.acceptedWasteTypes ?? [],
    };

    if (profileByAuthId) {
      return db.profile.update({
        where: { id: profileByAuthId.id },
        data: profilePayload,
      });
    }

    return db.profile.upsert({
      where: { email: profilePayload.email },
      update: profilePayload,
      create: profilePayload,
    });
  }

  const cookieStore = await cookies();
  const demoEmail = cookieStore.get(DEMO_PROFILE_COOKIE)?.value || process.env.DEMO_PROFILE_EMAIL;
  if (!demoEmail) {
    return null;
  }

  return db.profile.findUnique({
    where: { email: demoEmail },
  });
}

export async function requireProfile() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}

export async function requireRole(...roles: Role[]) {
  const profile = await requireProfile();

  if (!roles.includes(profile.role)) {
    redirect(getDashboardPath(profile.role));
  }

  return profile;
}

export async function isDemoViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return !user;
}
