import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { DEMO_PROFILE_COOKIE } from "@/lib/auth";

const ALLOWED_DEMO_EMAILS = new Set([
  "budi@example.com",
  "andika@example.com",
  "admin@smartwaste.id",
]);

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
  }

  const email = request.nextUrl.searchParams.get("email") ?? "";
  const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/dashboard";

  if (!ALLOWED_DEMO_EMAILS.has(email)) {
    return NextResponse.json({ success: false, message: "Profil demo tidak valid." }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_PROFILE_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.redirect(new URL(redirectTo.startsWith("/") ? redirectTo : "/dashboard", request.url));
}
