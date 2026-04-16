import { switchDemoProfile } from "@/app/actions/demo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isDemoViewer } from "@/lib/auth";

const DEMO_PROFILES = [
  { email: "budi@example.com", label: "User" },
  { email: "andika@example.com", label: "Collector" },
  { email: "admin@smartwaste.id", label: "Admin" },
] as const;

export async function DemoSwitcher({ currentEmail }: { currentEmail?: string }) {
  const demoMode = await isDemoViewer();

  if (!demoMode) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1">
      <Badge variant="slate">Demo View</Badge>
      <div className="flex items-center gap-2">
        {DEMO_PROFILES.map((profile) => (
          <form key={profile.email} action={switchDemoProfile}>
            <input type="hidden" name="email" value={profile.email} />
            <Button variant={currentEmail === profile.email ? "default" : "ghost"} size="sm">
              {profile.label}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
