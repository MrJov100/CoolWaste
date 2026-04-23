import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Clock,
  Leaf,
  MapPin,
  MessageCircle,
  Recycle,
  ShieldCheck,
  Star,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoggedInCta, LoggedInSignupCta } from "@/components/landing/logged-in-cta";
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

      <main className="mx-auto max-w-7xl px-6 pb-32 pt-10">

        {/* ════════════════════════════════════════════════════════
            HERO SECTION
        ════════════════════════════════════════════════════════ */}
        <section className="relative mt-8 grid items-center gap-12 lg:mt-20 lg:grid-cols-2">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -left-20 -top-10 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-600/15 blur-[120px]" />
          <div className="pointer-events-none absolute right-0 top-20 -z-10 h-72 w-72 rounded-full bg-cyan-600/10 blur-[100px]" />

          <div className="space-y-7">
            <Badge
              variant="emerald"
              className="w-fit border-emerald-500/30 px-3 py-1 text-sm shadow-xl shadow-emerald-500/20"
            >
              <Leaf className="mr-2 h-4 w-4" />
              Platform Sampah Daur Ulang #1
            </Badge>

            <h1
              className="max-w-2xl text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Ubah Sampahmu Jadi{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Uang Nyata
              </span>
            </h1>

            <p className="max-w-xl text-lg leading-8 text-slate-300">
              CoolWaste secara otomatis menjodohkan sampah daur ulang Anda dengan pengepul
              terdekat. Transparan, hemat waktu, dan berdampak nyata bagi lingkungan.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {profile ? (
                <LoggedInCta />
              ) : (
                <Link href="/signup">
                  <Button size="lg" className="h-12 gap-2 rounded-full px-8 text-base shadow-lg shadow-emerald-500/25">
                    Mulai Jual Sampah
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link href="#cara-kerja">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/10 px-8 text-base hover:bg-white/5"
                >
                  Cara Kerja
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 pt-2">
              {["Auto-Matching Cerdas", "Cash on Delivery", "Verified Collectors"].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-sm text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Hero cards */}
          <div className="relative mx-auto w-full max-w-md lg:ml-auto lg:mr-0">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-emerald-500/15 to-cyan-900/20 blur-3xl" />
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
              <Card className="translate-x-4 border-white/10 bg-black/40 backdrop-blur-md">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-full bg-blue-500/20 p-3 text-blue-400">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Transaksi Adil</p>
                    <p className="text-lg font-semibold text-white">Cash on Delivery + Rating</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-black/40 backdrop-blur-md">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-full bg-amber-500/20 p-3 text-amber-400">
                    <Leaf className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Dampak Nyata</p>
                    <p className="text-lg font-semibold text-white">Kurangi CO₂ Bersama</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            STATS SECTION
        ════════════════════════════════════════════════════════ */}
        <section className="mt-24 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <Card
              key={item.label}
              className="border-emerald-500/10 bg-gradient-to-b from-white/[0.04] to-transparent"
            >
              <CardHeader className="pb-2">
                <CardTitle className="bg-gradient-to-br from-white to-slate-400 bg-clip-text text-4xl font-bold text-transparent">
                  {item.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-slate-300">{item.label}</p>
                <p className="mt-1 text-sm text-slate-500">{item.hint}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* ════════════════════════════════════════════════════════
            ABOUT SECTION
        ════════════════════════════════════════════════════════ */}
        <section id="tentang" className="mt-32 grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
              Tentang CoolWaste
            </p>
            <h2
              className="text-4xl font-bold leading-tight text-white md:text-5xl"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Solusi Cerdas untuk Masalah Sampah Kita
            </h2>
            <p className="text-lg leading-8 text-slate-300">
              CoolWaste adalah platform digital yang menghubungkan rumah tangga dengan pengepul
              sampah daur ulang terverifikasi di sekitar mereka. Kami percaya bahwa setiap
              kilogram sampah memiliki nilai — dan teknologi kami hadir untuk membuktikannya.
            </p>
            <p className="leading-7 text-slate-400">
              Dengan algoritma pencocokan berbasis jarak nyata (Haversine), sistem batching
              rute cerdas, dan transparansi harga real-time, CoolWaste mengubah cara Indonesia
              mengelola sampah daur ulang — dari proses manual yang melelahkan menjadi
              pengalaman digital yang mudah dan menguntungkan.
            </p>
            <div className="flex gap-6 pt-2">
              <div>
                <p className="text-2xl font-bold text-emerald-400">5+</p>
                <p className="text-sm text-slate-400">Jenis sampah diterima</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">3</p>
                <p className="text-sm text-slate-400">Slot waktu penjemputan</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">COD</p>
                <p className="text-sm text-slate-400">Bayar langsung di tempat</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-950/40 to-slate-900/60 p-8">
            <div className="absolute -inset-px -z-10 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-transparent blur-xl" />
            <div className="space-y-5">
              {[
                {
                  icon: MapPin,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/15",
                  title: "Untuk Warga & Rumah Tangga",
                  desc: "Jual sampah daur ulang langsung dari rumah tanpa harus keluar mencari pengepul.",
                },
                {
                  icon: Truck,
                  color: "text-blue-400",
                  bg: "bg-blue-500/15",
                  title: "Untuk Pengepul & Bank Sampah",
                  desc: "Terima pesanan terorganisir, rute teroptimasi, dan pelanggan yang datang sendiri.",
                },
                {
                  icon: BarChart3,
                  color: "text-amber-400",
                  bg: "bg-amber-500/15",
                  title: "Untuk Lingkungan",
                  desc: "Setiap transaksi direkap sebagai kontribusi pengurangan CO₂ yang transparan.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className={`shrink-0 rounded-xl ${item.bg} p-2.5 ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            KEUNGGULAN SECTION
        ════════════════════════════════════════════════════════ */}
        <section id="keunggulan" className="mt-32">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
              Keunggulan Kami
            </p>
            <h2
              className="mt-3 text-3xl font-bold text-white md:text-4xl"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Fitur yang Membuat Kami Berbeda
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Bukan sekadar aplikasi direktori pengepul — CoolWaste adalah ekosistem pengelolaan
              sampah yang terintegrasi dari awal hingga akhir.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                color: "from-emerald-500/20 to-teal-500/10",
                iconColor: "text-emerald-400",
                title: "Auto-Matching Instan",
                desc: "Sistem langsung mencarikan pengepul terdekat yang cocok dengan jenis dan kapasitas sampah Anda begitu request dibuat.",
              },
              {
                icon: MapPin,
                color: "from-blue-500/20 to-blue-900/10",
                iconColor: "text-blue-400",
                title: "Radar Jarak Nyata",
                desc: "Menggunakan rumus Haversine untuk menghitung jarak sesungguhnya antara lokasi Anda dan pengepul, bukan estimasi kasar.",
              },
              {
                icon: Truck,
                color: "from-purple-500/20 to-purple-900/10",
                iconColor: "text-purple-400",
                title: "Batching Rute Cerdas",
                desc: "Beberapa pickup di area yang sama digabungkan menjadi satu rute efisien, menghemat waktu dan biaya operasional pengepul.",
              },
              {
                icon: ShieldCheck,
                color: "from-amber-500/20 to-amber-900/10",
                iconColor: "text-amber-400",
                title: "Pengepul Terverifikasi",
                desc: "Setiap pengepul melalui proses verifikasi admin sebelum dapat menerima pesanan, menjamin keamanan dan kepercayaan.",
              },
              {
                icon: Star,
                color: "from-rose-500/20 to-rose-900/10",
                iconColor: "text-rose-400",
                title: "Sistem Rating & Review",
                desc: "Setelah setiap pickup selesai, berikan penilaian untuk menjaga kualitas layanan pengepul tetap tinggi.",
              },
              {
                icon: BadgeCheck,
                color: "from-cyan-500/20 to-cyan-900/10",
                iconColor: "text-cyan-400",
                title: "Harga Transparan",
                desc: "Harga per kg tersimpan sebagai snapshot saat request dibuat, tidak bisa berubah di tengah jalan tanpa persetujuan.",
              },
            ].map((item) => (
              <Card
                key={item.title}
                className="group relative overflow-hidden border-white/5 bg-white/[0.02] transition-colors hover:bg-white/[0.04]"
              >
                <CardHeader>
                  <div
                    className={`mb-4 w-fit rounded-2xl bg-gradient-to-br ${item.color} p-3 ${item.iconColor} transition-transform group-hover:scale-110`}
                  >
                    <item.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl text-white">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-slate-400">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            WHY CHOOSE US SECTION
        ════════════════════════════════════════════════════════ */}
        <section id="kenapa-kami" className="mt-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
                Kenapa CoolWaste?
              </p>
              <h2
                className="text-4xl font-bold leading-tight text-white md:text-5xl"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                Lebih dari Sekadar Jual Sampah
              </h2>
              <p className="text-lg leading-8 text-slate-300">
                CoolWaste dirancang untuk semua pihak — bukan hanya nyaman bagi pengguna, tapi
                juga menguntungkan bagi pengepul dan berdampak bagi lingkungan.
              </p>

              <ul className="space-y-4 pt-2">
                {[
                  "Tidak perlu keluar rumah untuk mencari pengepul",
                  "Harga terbaik dari pengepul terdekat yang bersaing",
                  "Chat langsung dengan pengepul setelah jadwal dikonfirmasi",
                  "Riwayat transaksi lengkap dan bisa diekspor",
                  "Leaderboard kontribusi CO₂ untuk memotivasi aksi nyata",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Comparison table */}
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-5 py-4 text-left font-semibold text-slate-300">Aspek</th>
                    <th className="px-5 py-4 text-center font-semibold text-slate-500">
                      Cara Lama
                    </th>
                    <th className="px-5 py-4 text-center font-semibold text-emerald-400">
                      CoolWaste
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Cari pengepul", "Manual keliling", "Otomatis"],
                    ["Kepastian harga", "Nego di tempat", "Transparan & terkunci"],
                    ["Jadwal pickup", "Tidak pasti", "Slot Pagi/Siang/Sore"],
                    ["Keamanan", "Tidak terverifikasi", "Admin-verified"],
                    ["Bukti transaksi", "Tidak ada", "Riwayat digital"],
                    ["Dampak lingkungan", "Tidak terlacak", "CO₂ tracker"],
                  ].map(([aspect, old, now], i) => (
                    <tr
                      key={aspect}
                      className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`}
                    >
                      <td className="px-5 py-3.5 font-medium text-white">{aspect}</td>
                      <td className="px-5 py-3.5 text-center text-slate-500">{old}</td>
                      <td className="px-5 py-3.5 text-center font-medium text-emerald-400">
                        {now}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            USER FLOW SECTION
        ════════════════════════════════════════════════════════ */}
        <section id="cara-kerja" className="mt-32">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
              Cara Kerja
            </p>
            <h2
              className="mt-3 text-3xl font-bold text-white md:text-4xl"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Dari Sampah ke Saldo dalam 6 Langkah
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Proses yang simpel, transparan, dan sepenuhnya terotomatisasi dari sisi Anda.
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-[39px] top-12 hidden h-[calc(100%-96px)] w-px bg-gradient-to-b from-emerald-500/50 via-emerald-500/20 to-transparent md:block" />

            <div className="space-y-6">
              {[
                {
                  step: "01",
                  icon: MapPin,
                  title: "Buat Permintaan Pickup",
                  desc: "Pilih jenis sampah, estimasi berat, titik lokasi via GPS, dan slot waktu penjemputan (Pagi, Siang, atau Sore).",
                  tag: "Hanya ~2 menit",
                },
                {
                  step: "02",
                  icon: Zap,
                  title: "Sistem Mencarikan Pengepul",
                  desc: "Algoritma auto-matching memfilter pengepul berdasarkan jenis sampah, sisa kapasitas, dan mengurutkan berdasarkan jarak terdekat.",
                  tag: "Otomatis & instan",
                },
                {
                  step: "03",
                  icon: Truck,
                  title: "Pengepul Konfirmasi Jadwal",
                  desc: "Pengepul menerima batch rute yang sudah dikelompokkan. Setelah konfirmasi, jadwal dikunci dan chat terbuka.",
                  tag: "Notifikasi real-time",
                },
                {
                  step: "04",
                  icon: MessageCircle,
                  title: "Chat & Koordinasi",
                  desc: "Gunakan fitur chat bawaan untuk koordinasi detail lokasi atau konfirmasi waktu tepat kedatangan pengepul.",
                  tag: "Chat langsung",
                },
                {
                  step: "05",
                  icon: Recycle,
                  title: "Penjemputan & Penimbangan",
                  desc: "Pengepul datang ke lokasi Anda, menimbang sampah aktual, dan menginput berat final di aplikasi.",
                  tag: "Cash on Delivery",
                },
                {
                  step: "06",
                  icon: Star,
                  title: "Pembayaran & Rating",
                  desc: "Terima pembayaran sesuai berat aktual × harga terkunci. Berikan rating 1–5 bintang untuk menjaga kualitas layanan.",
                  tag: "Selesai! 🎉",
                },
              ].map((item, idx) => (
                <div key={idx} className="relative flex gap-6">
                  {/* Step number + icon */}
                  <div className="relative shrink-0">
                    <div className="flex h-[78px] w-[78px] flex-col items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      <item.icon className="h-6 w-6" />
                      <span className="mt-1 text-xs font-bold text-emerald-500/70">
                        {item.step}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                        {item.tag}
                      </span>
                    </div>
                    <p className="mt-2 leading-relaxed text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            CTA REGISTRASI SECTION
        ════════════════════════════════════════════════════════ */}
        <section className="relative mt-32 overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/50 to-slate-950 p-12 text-center">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-600/20 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-cyan-600/15 blur-[80px]" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <Badge variant="emerald" className="mb-6 w-fit border-emerald-500/30">
              <Clock className="mr-2 h-4 w-4" />
              Daftar gratis, selamanya
            </Badge>

            <h2
              className="text-3xl font-bold text-white md:text-4xl"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Bergabung dan Ubah Kebiasaan Membuang Sampah
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
              Setiap kilogram plastik dan kertas yang Anda jual hari ini berdampak nyata bagi
              generasi mendatang. Bergabunglah dengan ribuan warga yang sudah memulai.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {profile ? (
                <>
                  <LoggedInSignupCta label="Daftar sebagai Warga" />
                  <LoggedInSignupCta label="Daftar sebagai Pengepul" variant="outline" />
                </>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="h-12 gap-2 rounded-full px-8 text-base shadow-lg shadow-emerald-500/30">
                      Daftar sebagai Warga
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 rounded-full border-emerald-500/30 px-8 text-base text-emerald-300 hover:bg-emerald-500/10"
                    >
                      Daftar sebagai Pengepul
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {!profile && (
              <p className="mt-6 text-sm text-slate-500">
                Sudah punya akun?{" "}
                <Link href="/login" className="text-emerald-400 hover:underline">
                  Login di sini
                </Link>
              </p>
            )}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-sm text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2 text-white">
            <div className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-400">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="font-semibold">CoolWaste</span>
          </div>
          <p>© 2025 CoolWaste · Platform Sampah Daur Ulang Indonesia</p>
          <div className="flex gap-5">
            <Link href="/leaderboard" className="hover:text-slate-300">Leaderboard</Link>
            <Link href="/login" className="hover:text-slate-300">Login</Link>
            <Link href="/signup" className="hover:text-slate-300">Daftar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
