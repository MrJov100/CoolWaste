import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";

const iconMap = {
  success: CheckCircle2,
  info: AlertCircle,
  warning: Clock3,
} as const;

const toneMap = {
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  info: "border-sky-400/20 bg-sky-400/10 text-sky-100",
  warning: "border-amber-300/20 bg-amber-300/10 text-amber-100",
} as const;

export function StatusBanner({
  title,
  message,
  tone = "info",
}: {
  title: string;
  message: string;
  tone?: keyof typeof iconMap;
}) {
  const Icon = iconMap[tone];

  return (
    <div className={cn("rounded-[28px] border px-5 py-4", toneMap[tone])}>
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm opacity-90">{message}</p>
        </div>
      </div>
    </div>
  );
}
