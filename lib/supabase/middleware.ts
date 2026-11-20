import { createServerClient } from "@supabase/ssr";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const AUTH_RETRY_DELAY_MS = 500;

// Returns the authenticated user (or null) and a response that carries
// any refreshed session cookies. Call this first in middleware.ts and
// build on the returned response so the refreshed cookies aren't dropped.
export async function getUserAndResponse(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  let result = await supabase.auth.getUser();
  if (isAuthRetryableFetchError(result.error)) {
    await new Promise((resolve) => setTimeout(resolve, AUTH_RETRY_DELAY_MS));
    result = await supabase.auth.getUser();
  }

  // A network failure also returns a null user, but says nothing about the session.
  const authUnavailable = isAuthRetryableFetchError(result.error);
  if (authUnavailable) {
    console.error("Supabase Auth unreachable:", result.error?.message);
  }

  return { user: result.data.user, authUnavailable, supabase, response };
}
