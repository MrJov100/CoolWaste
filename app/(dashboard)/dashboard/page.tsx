import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { getDashboardPath } from "@/lib/constants";

export default async function DashboardEntryPage() {
  const profile = await requireProfile();

  redirect(getDashboardPath(profile.role));
}
