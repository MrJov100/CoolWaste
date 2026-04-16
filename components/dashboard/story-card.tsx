import { Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function StoryCard({
  title,
  description,
  points,
}: {
  title: string;
  description: string;
  points: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {points.map((point) => (
          <div key={point} className="flex gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mt-0.5 rounded-2xl bg-amber-400/15 p-2 text-amber-200">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-sm leading-7 text-slate-300">{point}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
