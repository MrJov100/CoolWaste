"use client";

import { usePathname } from "next/navigation";

import { switchDevAccount } from "@/app/(auth)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEV_ACCOUNTS } from "@/lib/dev-accounts";

export function DevAccountSwitcher({ currentEmail }: { currentEmail?: string }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2">
      <Badge variant="amber">Dev Login</Badge>
      <div className="flex flex-wrap items-center gap-2">
        {DEV_ACCOUNTS.map((account) => (
          <form key={account.email} action={switchDevAccount}>
            <input type="hidden" name="email" value={account.email} />
            <input type="hidden" name="redirectTo" value={pathname} />
            <Button variant={currentEmail === account.email ? "default" : "ghost"} size="sm">
              {account.label}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
