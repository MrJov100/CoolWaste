import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", {
  variants: {
    variant: {
      emerald: "bg-emerald-500/15 text-emerald-300",
      amber: "bg-amber-500/15 text-amber-200",
      slate: "bg-white/10 text-slate-200",
      rose: "bg-rose-500/15 text-rose-200",
    },
  },
  defaultVariants: {
    variant: "slate",
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
