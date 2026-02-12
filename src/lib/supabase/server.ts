import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Custom fetch wrapper that intercepts non-JSON / network-error responses
 * (e.g. Cloudflare 522 HTML pages) and re-maps them to a retryable 503 with
 * valid JSON. This avoids two problems:
 *
 * 1. The SDK trying to JSON.parse an HTML body → AuthUnknownError.
 * 2. A hard status like 522 (not in the SDK's NETWORK_ERROR_CODES list)
 *    causing the session to be permanently removed instead of retried later.
 *
 * Returning 503 + JSON makes the SDK throw AuthRetryableFetchError, which
 * callers already catch and handle gracefully.
 */
const resilientFetch: typeof globalThis.fetch = async (input, init) => {
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
};

// Read-only client for Server Components (no cookie writes)
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        // No-op in Server Components to avoid Next.js cookie write error
        setAll() {
          /* noop */
        },
      },
      global: { fetch: resilientFetch },
    }
  );
}

// Write-enabled client for Route Handlers / Server Actions
export async function createRouteClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
      global: { fetch: resilientFetch },
    }
  );
}


