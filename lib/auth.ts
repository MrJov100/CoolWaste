import { Role, VerificationState } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDashboardPath } from "@/lib/constants";
import { db } from "@/lib/db";

export const DEMO_PROFILE_COOKIE = "cool-waste-demo-email";

export async function getCurrentProfile() {
  const cookieStore = await cookies();

  // Session cookie set on login
  const sessionEmail = cookieStore.get("cw-session")?.value;
  if (sessionEmail) {
    return db.profile.findUnique({ where: { email: sessionEmail } });
  }

  // Legacy demo / dev switcher cookie
  const demoEmail = cookieStore.get(DEMO_PROFILE_COOKIE)?.value || process.env.DEMO_PROFILE_EMAIL;
  if (!demoEmail) {
    return null;
  }

  return db.profile.findUnique({ where: { email: demoEmail } });
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
  const cookieStore = await cookies();
  return !cookieStore.get("cw-session")?.value;
}
