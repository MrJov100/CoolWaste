import { Badge } from "@/components/ui/badge";

export function ShowcaseHero() {
  return (
    <section className="relative overflow-hidden rounded-[40px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(15,23,42,0.88)_48%,rgba(245,158,11,0.14))] p-8 md:p-12">
      <div className="absolute -right-16 top-8 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="relative z-10 grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
        <div className="space-y-5">
          <Badge variant="emerald" className="w-fit">
            Jury Showcase Mode
          </Badge>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
            Cool Waste mengubah sampah rumah tangga menjadi aksi, data, dan dampak yang bisa diukur.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-200">
            Halaman ini dirancang khusus untuk presentasi lomba: angka utama, leaderboard, dan cerita dampak tampil
            dalam satu alur yang ringkas dan meyakinkan.
          </p>
        </div>
        <div className="grid gap-4 text-sm text-slate-200">
          {[
            "Multi-role workflow: user, collector, admin",
            "Stack modern: Next.js, Prisma, Supabase, PostgreSQL",
            "Siap dihubungkan ke modul AI ketika klasifikasi sampah sudah stabil",
          ].map((item) => (
            <div key={item} className="rounded-3xl border border-white/10 bg-slate-950/45 px-5 py-4">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
