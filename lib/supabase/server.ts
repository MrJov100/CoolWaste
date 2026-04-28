import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasSupabaseAuthEnv } from "@/lib/supabase/env";

function assertSupabaseEnv() {
  if (!hasSupabaseAuthEnv()) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env",
    );
  }
}

export async function createClient() {
  assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookie mutation hanya boleh di Server Action/Middleware — diabaikan di Server Component
          }
        },
      },
    },
  );
}
