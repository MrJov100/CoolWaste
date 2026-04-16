import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ success: false, message: "Latitude dan longitude wajib diisi." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`,
      {
        headers: {
          "User-Agent": "Cool Waste Competition Platform",
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json({ success: false, message: "Gagal mengambil alamat." }, { status: response.status });
    }

    const payload = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        displayName: payload.display_name ?? "",
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Reverse geocoding tidak tersedia saat ini." }, { status: 500 });
  }
}
