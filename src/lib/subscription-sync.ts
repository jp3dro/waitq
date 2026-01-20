import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getAdminClient } from "@/lib/supabase/admin";
import { orderedPlans, plans, type PlanId } from "@/lib/plans";

const ACTIVE_LIKE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
]);

function toIsoFromUnixSeconds(sec?: number | null) {
  if (typeof sec !== "number") return null;
  const d = new Date(sec * 1000);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function derivePlanIdFromSubscription(sub: Stripe.Subscription): PlanId | "free" {
  const price = sub.items?.data?.[0]?.price || null;
  const priceLookupKey = (price?.lookup_key as string | null) || null;
  const metadataLookupKey =
    (sub.metadata?.lookup_key as string | undefined) ||
    (sub.metadata?.lookupKey as string | undefined) ||
    null;
  const lookupKey = metadataLookupKey || priceLookupKey;
  const metadataPlanId =
    (sub.metadata?.plan_id as string | undefined) ||
    (sub.metadata?.planId as string | undefined) ||
    null;

  if (metadataPlanId === "base" || metadataPlanId === "premium" || metadataPlanId === "free") {
    return metadataPlanId;
  }

  if (lookupKey) {
    const byLookup = orderedPlans.find((p) => p.stripe.priceLookupKeyMonthly === lookupKey);
    if (byLookup) return byLookup.id;
  }

  if (typeof price?.unit_amount === "number") {
    const amountEur = Math.round(price.unit_amount) / 100;
    const match = orderedPlans.find(
      (p) => Math.round(p.priceMonthlyEUR * 100) === Math.round(amountEur * 100)
    );
    if (match) return match.id;
  }

  if (price?.product && typeof price.product === "string") {
    const productId = price.product as string;
    const byProduct = Object.values(plans).find((p) => p.stripe.productId === productId);
    if (byProduct) return byProduct.id;
  }

  return "free";
}

async function resolveBusinessIdForUser(userId: string) {
  const admin = getAdminClient();
  const { data: owned } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (owned?.id) return owned.id as string;

  const { data: memberOf } = await admin
    .from("memberships")
    .select("business_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (memberOf?.business_id as string | undefined) || null;
}

async function findCustomerId({
  stripe,
  userId,
  email,
}: {
  stripe: ReturnType<typeof getStripe>;
  userId: string;
  email?: string | null;
}) {
  // 1) Prefer Stripe subscription search by metadata user_id (if enabled)
  try {
    const searchFn = (stripe.subscriptions as unknown as {
      search?: (params: { query: string; limit: number }) => Promise<{ data: Stripe.Subscription[] }>;
    }).search;
    if (searchFn) {
      const search = await searchFn({
        query: `metadata['user_id']:'${userId}' OR metadata['userId']:'${userId}'`,
        limit: 1,
      });
      const found = search?.data?.[0];
      const customerId = (found?.customer as string | undefined) || null;
      if (customerId) return customerId;
    }
  } catch {
    // ignore
  }

  // 2) Fallback to customer lookup by email
  if (email) {
    try {
      const custList = await stripe.customers.list({ email, limit: 1 });
      const customerId = custList.data?.[0]?.id ?? null;
      if (customerId) return customerId;
    } catch {
      // ignore
    }
  }

  return null;
}

async function cancelPreviousSubscriptionIfNeeded({
  stripe,
  newSubscription,
}: {
  stripe: ReturnType<typeof getStripe>;
  newSubscription: Stripe.Subscription;
}) {
  const upgradeFrom =
    (newSubscription.metadata?.upgrade_from_subscription_id as string | undefined) || "";
  if (!upgradeFrom) return;
  if (upgradeFrom === newSubscription.id) return;

  try {
    await stripe.subscriptions.cancel(upgradeFrom, { prorate: false });
  } catch (e) {
    console.error("Failed to cancel previous subscription:", upgradeFrom, e);
  }
}

export async function syncSubscriptionForUser({
  userId,
  email,
}: {
  userId: string;
  email?: string | null;
}) {
  const stripe = getStripe();
  const admin = getAdminClient();

  const customerId = await findCustomerId({ stripe, userId, email });
  if (!customerId) return { ok: true, planId: "free" as const, customerId: null };

  let activeSub: Stripe.Subscription | null = null;
  try {
    const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 50 });
    const sorted = subs.data
      .slice()
      .sort((a, b) => (b.created || 0) - (a.created || 0));
    const candidate = sorted.find((s) => ACTIVE_LIKE_STATUSES.has(s.status)) || null;
    if (candidate?.id) {
      activeSub = await stripe.subscriptions.retrieve(candidate.id);
    }
  } catch {
    // ignore
  }

  // If there is no active subscription, actively clear any cached paid plan in DB.
  if (!activeSub) {
    const businessId = await resolveBusinessIdForUser(userId);
    try {
      await admin
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            business_id: businessId,
            stripe_customer_id: customerId,
            stripe_subscription_id: null,
            plan_id: null,
            price_lookup_key: null,
            price_id: null,
            latest_invoice_id: null,
            collection_method: null,
            billing_cycle_anchor: null,
            cancel_at_period_end: null,
            status: "canceled",
            current_period_start: null,
            current_period_end: null,
            trial_end: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
    } catch (e) {
      console.error("Failed to clear subscription row during sync:", e);
    }
    return { ok: true, planId: "free" as const, customerId };
  }

  // If the subscription is marked for end-of-period cancellation, cancel it immediately.
  if (activeSub.cancel_at_period_end === true && activeSub.status !== "canceled") {
    try {
      await stripe.subscriptions.cancel(activeSub.id, { prorate: false });
      // Re-fetch to get the updated status
      activeSub = await stripe.subscriptions.retrieve(activeSub.id);
    } catch (e) {
      console.error("Failed to cancel subscription immediately during sync:", activeSub.id, e);
    }
  }

  const planId = derivePlanIdFromSubscription(activeSub);
  const price = activeSub.items?.data?.[0]?.price || null;
  const priceLookupKey = (price?.lookup_key as string | null) || null;
  const metadataLookupKey =
    (activeSub.metadata?.lookup_key as string | undefined) ||
    (activeSub.metadata?.lookupKey as string | undefined) ||
    null;
  const lookupKey = metadataLookupKey || priceLookupKey;

  const firstItem = activeSub.items?.data?.[0];
  const currentPeriodStartIso = toIsoFromUnixSeconds(firstItem?.current_period_start);
  const currentPeriodEndIso = toIsoFromUnixSeconds(firstItem?.current_period_end);
  const trialEndIso = toIsoFromUnixSeconds((activeSub as any).trial_end as number | undefined);
  const billingCycleAnchorIso = toIsoFromUnixSeconds(
    (activeSub as any).billing_cycle_anchor as number | undefined
  );

  const businessId = await resolveBusinessIdForUser(userId);

  try {
    await admin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          business_id: businessId,
          stripe_customer_id: customerId,
          stripe_subscription_id: activeSub.id as string,
          plan_id: planId === "free" ? null : planId,
          price_lookup_key: lookupKey,
          price_id: (price?.id as string | undefined) || null,
          latest_invoice_id: (activeSub.latest_invoice as string | undefined) || null,
          collection_method: (activeSub.collection_method as string | undefined) || null,
          billing_cycle_anchor: billingCycleAnchorIso,
          cancel_at_period_end:
            typeof activeSub.cancel_at_period_end === "boolean" ? activeSub.cancel_at_period_end : null,
          status: activeSub.status as string,
          current_period_start: currentPeriodStartIso,
          current_period_end: currentPeriodEndIso,
          trial_end: trialEndIso,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
  } catch (e) {
    console.error("Failed to upsert subscription row during sync:", e);
  }

  // Best-effort: if this subscription was created as an upgrade, ensure the previous one is canceled.
  if (ACTIVE_LIKE_STATUSES.has(activeSub.status)) {
    await cancelPreviousSubscriptionIfNeeded({ stripe, newSubscription: activeSub });
  }

  return { ok: true, planId, customerId };
}

