import Link from "next/link";

import { signUp } from "@/app/(auth)/actions";
import { SignupFlow } from "@/app/(auth)/signup/signup-flow";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-6 py-12">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Buat Akun Baru</p>
            <h1 className="text-5xl font-semibold text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              Daftar ke Smart Waste dengan alur pickup user-collector terbaru.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-300">
              User cukup simpan identitas dan alamat utama. Collector mengisi area layanan, jenis sampah, harga per kg,
              dan kapasitas harian sejak awal lalu menunggu verifikasi admin.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login">
                <Button variant="outline">Sudah punya akun? Login</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost">Buka dashboard</Button>
              </Link>
              <Link href="/dashboard/demo">
                <Button variant="outline">Lihat demo view</Button>
              </Link>
            </div>
          </div>

          <Card className="max-w-xl">
            <CardHeader>
              <CardDescription>Role-aware registration</CardDescription>
              <CardTitle>Daftar dengan email</CardTitle>
            </CardHeader>
            <CardContent>
              <SignupFlow action={signUp} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
