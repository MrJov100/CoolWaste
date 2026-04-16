import type { HighlightStat } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function HighlightGrid({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: HighlightStat[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
            <p className="mt-2 text-sm text-slate-400">{item.note}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
