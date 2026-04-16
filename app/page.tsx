import Link from "next/link";
import { ArrowRight, Leaf, MapPin, Recycle, ShieldCheck, Wallet } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth";
import { getLandingStats } from "@/lib/data/dashboard";

export default async function HomePage() {
  const [profile, stats] = await Promise.all([getCurrentProfile(), getLandingStats()]);

  return (
    <div className="min-h-screen bg-slate-950 selection:bg-emerald-500/30">
      <Topbar
        profile={
          profile
            ? {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                saldo: profile.saldo,
                address: profile.address,
              }
            : null
        }
      />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        {/* HERO SECTION */}
        <section className="relative mt-8 grid items-center gap-10 lg:mt-20 lg:grid-cols-2">
          {/* Background Glow */}
          <div className="absolute -left-10 top-0 -z-10 h-96 w-96 rounded-full bg-emerald-600/20 blur-[100px]" />
          
          <div className="space-y-6">
            <Badge variant="emerald" className="w-fit border-emerald-500/30 px-3 py-1 text-sm shadow-xl shadow-emerald-500/20">
              <Leaf className="mr-2 h-4 w-4" /> Cool Waste Eco-Tech
            </Badge>
            <h1
              className="max-w-2xl text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Cool Waste: Ubah Limbah Menjadi <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Nilai Nyata</span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-300">
              Aplikasi cerdas yang secara otomatis menjodohkan sampah daur ulang Anda dengan pengepul terdekat. Transparan, hemat waktu, dan ramah lingkungan.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href={profile ? "/dashboard" : "/signup"}>
                <Button size="lg" className="h-12 rounded-full px-8 text-base shadow-lg shadow-emerald-500/25">
                  Mulai Jual Sampah
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/showcase">
                <Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base border-white/10 hover:bg-white/5">
                  Lihat Cara Kerja
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:ml-auto lg:mr-0">
             <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/40 blur-2xl flex" />
             <div className="grid gap-4">
                <Card className="border-white/10 bg-black/40 backdrop-blur-md">
                   <CardContent className="flex items-center gap-4 p-6">
                      <div className="rounded-full bg-emerald-500/20 p-3 text-emerald-400">
                         <Recycle className="h-6 w-6" />
                      </div>
                      <div>
                         <p className="text-sm text-slate-400">Sistem Pintar</p>
                         <p className="text-lg font-semibold text-white">Auto-Matching Haversine</p>
                      </div>
                   </CardContent>
                </Card>
                <Card className="border-white/10 bg-black/40 backdrop-blur-md translate-x-4">
                   <CardContent className="flex items-center gap-4 p-6">
                      <div className="rounded-full bg-blue-500/20 p-3 text-blue-400">
                         <Wallet className="h-6 w-6" />
                      </div>
                      <div>
                         <p className="text-sm text-slate-400">Transaksi Adil</p>
                         <p className="text-lg font-semibold text-white">Cash on Delivery + Bintang</p>
                      </div>
                   </CardContent>
                </Card>
             </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="mt-24 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.label} className="border-emerald-500/10 bg-gradient-to-b from-white/[0.04] to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">{item.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-slate-300">{item.label}</p>
                <p className="mt-1 text-sm text-slate-500">{item.hint}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="mt-32">
          <div className="mb-12 text-center text-white">
            <h2 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: "var(--font-sora), sans-serif" }}>Pilar Ekosistem Kami</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">Sistem ini memangkas kerumitan. Semua proses diotomatisasi untuk mempercepat pergeseran limbah Anda menjadi komoditas.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Radar Penjemputan",
                text: "Tak perlu pusing memilih, sistem secara cerdas menghitung titik radius antara Anda dan pengepul secara _realtime_.",
              },
              {
                icon: ShieldCheck,
                title: "Kapasitas & Rute Ekstra",
                text: "Bagi collector, jadwal diatur ke dalam rute searah dengan prioritas sisa bagasi harian yang mumpuni.",
              },
              {
                icon: Leaf,
                title: "Dampak Lingkungan Transparan",
                text: "Sampah yang terjual akan direkap sebagai wujud jejak kontribusi mengurangi CO2 masyarakat kita.",
              },
            ].map((item, idx) => (
              <Card key={idx} className="group relative overflow-hidden border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <CardHeader>
                  <div className="mb-4 w-fit rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-3 text-emerald-400 group-hover:scale-110 transition-transform">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-slate-300">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="mt-32 rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/40 to-slate-950 p-10 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
             <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-sora), sans-serif" }}>Bersama Cool Waste, Jadikan Bumi Bersih Kembali</h2>
                <p className="mx-auto max-w-2xl text-slate-300 mb-8">Setiap kilogram botol dan kertas yang Anda jual hari ini memiliki dampak untuk ratusan tahun mendatang. Bergabunglah dengan ribuan masyarakat lainnya.</p>
                <Link href="/signup">
                   <Button size="lg" className="h-12 rounded-full px-8 font-semibold">
                      Daftar Sekarang Tanpa Biaya
                   </Button>
                </Link>
             </div>
        </section>
      </main>
    </div>
  );
}
