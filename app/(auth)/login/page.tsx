import Link from "next/link";

import { signIn } from "@/app/(auth)/actions";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormState } from "@/components/ui/form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-6 py-12">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Supabase Auth</p>
            <h1 className="text-5xl font-semibold text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              Login untuk membuka dashboard Cool Waste versi lomba.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-300">
              Gunakan akun Supabase yang sudah kamu hubungkan dengan project ini. Kalau Supabase belum siap, kamu tetap
              bisa masuk ke mode demo melalui halaman dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup">
                <Button>Daftar akun baru</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Masuk dashboard</Button>
              </Link>
              <Link href="/dashboard/demo">
                <Button variant="ghost">Masuk mode demo</Button>
              </Link>
            </div>
          </div>

          <Card className="max-w-xl">
            <CardHeader>
              <CardDescription>Secure sign-in</CardDescription>
              <CardTitle>Masuk dengan email</CardTitle>
            </CardHeader>
            <CardContent>
              <FormState action={signIn} submitLabel="Masuk ke dashboard">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="admin@smartwaste.id" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="Minimal 6 karakter" />
                </div>
                <p className="text-sm text-slate-400">
                  Belum punya akun?{" "}
                  <Link href="/signup" className="text-emerald-300 underline-offset-4 hover:underline">
                    Daftar di sini
                  </Link>
                  .
                </p>
              </FormState>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
