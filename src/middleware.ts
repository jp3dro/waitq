import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Keep Supabase auth cookies fresh on every request.
 *
 * Why: Server Components can't write cookies during render, so sessions can "work"
 * for the current request (in-memory refresh) but still leave the browser with
 * expired cookies. That then causes authenticated Route Handlers to return 401,
 * which looks like "random sign-outs" in production.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
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
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Trigger a session refresh if needed.
  await supabase.auth.getUser();

  return res;
}

export const config = {
  matcher: [
    // Skip Next.js internals and common static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};

