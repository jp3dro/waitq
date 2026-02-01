import { getAdminClient } from "@/lib/supabase/admin";

type PolarSubscription = {
  id: string;
  status: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
  customer?: { id: string; external_id?: string | null } | null;
  customer_id?: string | null;
  product_id?: string | null;
  product?: { id: string } | null;
  started_at?: string | null;
  ended_at?: string | null;
};

function polarApiBase() {
  const server = (process.env.POLAR_SERVER || "").toLowerCase().trim();
  return server === "production" ? "https://api.polar.sh" : "https://sandbox-api.polar.sh";
}

function planFromProductId(productId: string | null) {
  if (!productId) return null;
  if (process.env.PRODUCT_ID_BASE && productId === process.env.PRODUCT_ID_BASE) return "base";
  if (process.env.PRODUCT_ID_PREMIUM && productId === process.env.PRODUCT_ID_PREMIUM) return "premium";
  return null;
}

function isActiveLikeStatus(status: string | null) {
  const s = (status || "").toLowerCase();
  return s === "active" || s === "trialing" || s === "past_due";
}

async function fetchJson<T>(url: string) {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) throw new Error("POLAR_ACCESS_TOKEN missing");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Polar API ${res.status}: ${body || res.statusText}`);
  }
  return (await res.json()) as T;
}

/**
 * API-only billing sync for Polar:
 * - Pulls the user's subscriptions from Polar (by external_customer_id = Supabase user id)
 * - Derives plan from product_id
 * - Upserts the existing `subscriptions` row (using `polar_*` columns for Polar ids)
 *
 * No webhooks required.
 */
export async function syncPolarSubscriptionForUser({
  userId,
}: {
  userId: string;
}) {
  const admin = getAdminClient();

  const listUrl = new URL("/v1/subscriptions", polarApiBase());
  listUrl.searchParams.set("external_customer_id", userId);
  listUrl.searchParams.set("limit", "20");
  listUrl.searchParams.set("sorting", "-started_at");

  const data = await fetchJson<{ items?: PolarSubscription[] }>(listUrl.toString());
  const subs = Array.isArray(data.items) ? data.items : [];

  const active = subs.find((s) => isActiveLikeStatus(s.status)) || null;

  if (!active) {
    // No active subscription → user is on free tier (no subscription).
    await admin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          polar_customer_id: null,
          polar_subscription_id: null,
          plan_id: null,
          price_lookup_key: null,
          status: "canceled",
          cancel_at_period_end: null,
          current_period_start: null,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    return { ok: true, planId: "free" as const, status: "canceled" as const };
  }

  const productId = (active.product?.id as string | undefined) || (active.product_id as string | undefined) || null;
  const planId = planFromProductId(productId);
  const customerId =
    (active.customer?.id as string | undefined) || (active.customer_id as string | undefined) || null;

  await admin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        polar_customer_id: customerId,
        polar_subscription_id: active.id,
        plan_id: planId,
        price_lookup_key: planId === "base" ? "BASE" : planId === "premium" ? "PREMIUM" : null,
        status: active.status,
        cancel_at_period_end: typeof active.cancel_at_period_end === "boolean" ? active.cancel_at_period_end : null,
        current_period_start: active.current_period_start ?? null,
        current_period_end: active.current_period_end ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  return { ok: true, planId: (planId ?? "free") as "free" | "base" | "premium", status: active.status };
}

