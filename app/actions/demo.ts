"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { DEMO_PROFILE_COOKIE } from "@/lib/auth";

const ALLOWED_DEMO_EMAILS = [
  "budi@example.com",
  "andika@example.com",
  "admin@smartwaste.id",
] as const;

export async function switchDemoProfile(formData: FormData) {
  const email = String(formData.get("email") ?? "");

  if (!ALLOWED_DEMO_EMAILS.includes(email as (typeof ALLOWED_DEMO_EMAILS)[number])) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_PROFILE_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/demo");
  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/collector");
  revalidatePath("/dashboard/admin");
}
