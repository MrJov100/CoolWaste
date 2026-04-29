import { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDashboardPath } from "@/lib/constants";
import { db } from "@/lib/db";

export const DEMO_PROFILE_COOKIE = "cool-waste-demo-email";

export async function getCurrentProfile() {
  const cookieStore = await cookies();

  const sessionEmail = cookieStore.get("cw-session")?.value;
  if (sessionEmail) {
    return db.profile.findUnique({ where: { email: sessionEmail } });
  }

  return null;
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
