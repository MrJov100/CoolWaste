import { NextRequest, NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { getPickupsExportRows } from "@/lib/data/records";

export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;

  const rows = await getPickupsExportRows(profile.id, profile.role, { status });
  const csv = toCsv(rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cool-waste-pickups.csv"',
    },
  });
}
