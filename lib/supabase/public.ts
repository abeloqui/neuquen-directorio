import { createClient } from "@supabase/supabase-js";

// Cliente anonimo sin cookies: permite cache/ISR en paginas publicas.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
