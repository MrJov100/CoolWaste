import { CheckSquare2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DemoChecklistCard({
  items,
  compact = false,
}: {
  items: string[];
  compact?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Demo checklist</CardDescription>
        <CardTitle>Checklist presentasi lomba</CardTitle>
      </CardHeader>
      <CardContent className={compact ? "space-y-3" : "grid gap-3"}>
        {items.map((item, index) => (
          <div key={item} className="flex gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mt-0.5 rounded-2xl bg-emerald-400/15 p-2 text-emerald-300">
              <CheckSquare2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Step {index + 1}</p>
              <p className="mt-2 text-sm leading-7 text-slate-200">{item}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
