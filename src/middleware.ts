import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Keep Supabase auth cookies fresh on every request.
 *
 * Why: Server Components can't write cookies during render, so sessions can "work"
 * for the current request (in-memory refresh) but still leave the browser with
 * expired cookies. That then causes authenticated Route Handlers to return 401,
 * which looks like "random sign-outs" in production.
 *
 * Guard: If the token refresh *fails* (e.g. the browser client's auto-refresh
 * already consumed the refresh token due to a race), Supabase fires SIGNED_OUT
 * and tries to clear the auth cookies. We must NOT forward those deletions to
 * the browser — the browser client already holds a valid, freshly-rotated
 * session. Clearing the cookies here would destroy it and cause "random
 * sign-outs" on the next navigation.
 */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update the request cookies so downstream Server Components see the
          // refreshed session *during this same request*.
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });

          // Recreate the response so the updated request cookies are included.
          res = NextResponse.next({
            request: { headers: req.headers },
          });

          // Also persist cookies to the browser for subsequent requests.
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Trigger a session refresh if needed.
  const { data, error } = await supabase.auth.getUser();

  if (error && !data.user) {
    // The token refresh failed — most likely because the browser client already
    // rotated the refresh token (race condition). The response built by setAll
    // at this point would carry Set-Cookie headers that *delete* the auth
    // cookies, which would log the user out on the next request.
    //
    // Instead, return a clean response that does NOT touch the auth cookies.
    // The browser still has the valid session from its own refresh.
    return NextResponse.next({
      request: { headers: req.headers },
    });
  }

  return res;
}

export const config = {
  matcher: [
    // Skip Next.js internals and common static assets including Apple touch icons.
    "/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|xml|txt|json)$).*)",
  ],
};

