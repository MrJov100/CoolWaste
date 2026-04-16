import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cool Waste Competition Platform",
  description: "Platform Cool Waste dengan Next.js, Prisma, dan Supabase untuk kebutuhan demo lomba.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
