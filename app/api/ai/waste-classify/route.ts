import { NextResponse } from "next/server";

import { classifyWasteImage } from "@/lib/ai/waste-classifier";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, message: "File gambar wajib diunggah untuk klasifikasi AI." },
        { status: 400 },
      );
    }

    const result = await classifyWasteImage(file);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "AI classifier tidak tersedia saat ini.",
      },
      { status: 502 },
    );
  }
}
