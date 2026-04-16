import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    app: "cool-waste-competition-app",
    timestamp: new Date().toISOString(),
    stack: {
      frontend: "Next.js",
      language: "TypeScript",
      auth: "Supabase Auth",
      database: "PostgreSQL + Prisma",
    },
  });
}
