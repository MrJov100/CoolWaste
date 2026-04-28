import { createClient } from "@supabase/supabase-js";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

function assertAdminEnv() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error(
      "Supabase admin belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env",
    );
  }
}

export function createAdminClient() {
  assertAdminEnv();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
