import type { SummaryMetric } from "@/lib/types";

export function PitchMetricGrid({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{metric.label}</p>
          <p className="mt-4 text-4xl font-semibold text-white">{metric.value}</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">{metric.hint}</p>
        </div>
      ))}
    </div>
  );
}
