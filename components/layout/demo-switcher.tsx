import { isDemoViewer } from "@/lib/auth";
import { DemoDropdown } from "./demo-dropdown";

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

  return <DemoDropdown currentEmail={currentEmail} profiles={DEMO_PROFILES} />;
}
