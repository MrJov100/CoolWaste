function isMissing(value: string | undefined) {
  if (!value) return true;

  const normalized = value.trim();
  return (
    !normalized ||
    normalized === "your-anon-key" ||
    normalized === "your-service-role-key" ||
    normalized === "https://your-project.supabase.co"
  );
}

export function hasSupabaseAuthEnv() {
  return (
    !isMissing(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !isMissing(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function hasSupabaseAdminEnv() {
  return hasSupabaseAuthEnv() && !isMissing(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
