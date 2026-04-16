import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SummaryMetric } from "@/lib/types";

export function SummaryCard({ metric }: { metric: SummaryMetric }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{metric.label}</CardDescription>
        <CardTitle className="text-3xl">{metric.value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-400">{metric.hint}</p>
      </CardContent>
    </Card>
  );
}
