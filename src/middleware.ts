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
      // Custom fetch: intercept non-JSON responses (e.g. Cloudflare 522
      // HTML pages) and remap to a 503 with valid JSON. This prevents the
      // SDK from throwing AuthUnknownError and marks the error as retryable
      // so the session isn't prematurely removed.
      global: {
        fetch: async (input, init) => {
          try {
            const response = await fetch(input, init);
            const ct = response.headers.get("content-type") || "";
            if (!response.ok && !ct.includes("application/json")) {
              return new Response(
                JSON.stringify({ error: "upstream_unavailable", error_description: "Upstream returned non-JSON" }),
                { status: 503, headers: { "content-type": "application/json; charset=utf-8" } }
              );
            }
            return response;
          } catch {
            return new Response(
              JSON.stringify({ error: "network_error", error_description: "Network request failed" }),
              { status: 503, headers: { "content-type": "application/json; charset=utf-8" } }
            );
          }
        },
      },
    }
  );

  // Only attempt a session refresh if there are Supabase auth cookies present.
  // Without cookies there's no session to refresh, so calling getUser() would
  // just trigger a needless network round-trip that can fail with noisy errors
  // (e.g. AuthUnknownError when the response isn't valid JSON).
  const hasAuthCookie = req.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  if (hasAuthCookie) {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error && !data.user) {
        // Auth failed (expired/invalid session, API unreachable, etc.).
        // Clear stale auth cookies so subsequent requests don't re-trigger
        // the same failing refresh cycle and noisy SDK error logs.
        const clearRes = NextResponse.next({
          request: { headers: req.headers },
        });
        req.cookies.getAll().forEach(({ name }) => {
          if (name.startsWith("sb-") && name.includes("-auth-token")) {
            clearRes.cookies.delete(name);
          }
        });
        return clearRes;
      }
    } catch {
      // Supabase API unreachable — clear stale cookies and continue.
      const clearRes = NextResponse.next({
        request: { headers: req.headers },
      });
      req.cookies.getAll().forEach(({ name }) => {
        if (name.startsWith("sb-") && name.includes("-auth-token")) {
          clearRes.cookies.delete(name);
        }
      });
      return clearRes;
    }
  }

  return res;
}

export const config = {
  matcher: [
    // Skip Next.js internals and common static assets including Apple touch icons.
    "/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|xml|txt|json)$).*)",
  ],
};

