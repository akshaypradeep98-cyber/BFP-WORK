import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Request-scoped client: carries the caller's session, so RLS sees the
// real auth.uid(). Use this everywhere an API route reads/writes
// employees or tasks.
export async function createRequestClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll called from a Server Component; middleware refreshes
          // the session instead, so this is safe to ignore.
        }
      },
    },
  });
}

// Service-role client: bypasses RLS entirely. Only for server-only code
// that must act outside any single user's permissions (login's
// username -> email lookup, the one-time user migration script). Never
// import this into anything reachable from the browser.
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(supabaseUrl!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
