export const metadata = { title: "Subscription" };
export const dynamic = "force-dynamic";

import { orderedPlans, plans } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import SubscribeButton from "./subscribe-button";
import { getStripe } from "@/lib/stripe";
import { getAdminClient } from "@/lib/supabase/admin";
import { countEntriesInPeriod, countLocations, countSmsInPeriod, getPlanContext } from "@/lib/plan-limits";
import type Stripe from "stripe";
import PlanCards from "@/components/subscriptions/PlanCards";
import SubscriptionReturnRefresh from "@/components/subscription-return-refresh";
import { Progress } from "@/components/ui/progress";
import { DateTimeText } from "@/components/date-time-text";
import { syncPolarSubscriptionForUser } from "@/lib/polar-sync";

type PolarOrder = {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  currency: string;
  is_invoice_generated?: boolean;
  invoice_number?: string | null;
};

type PolarOrderWithInvoice = PolarOrder & { invoiceUrl?: string | null };

function polarApiBase() {
  const server = (process.env.POLAR_SERVER || "").toLowerCase().trim();
  return server === "production" ? "https://api.polar.sh" : "https://sandbox-api.polar.sh";
}

function formatCurrencyMinor(amountMinor: number, currency: string) {
  const c = (currency || "usd").toUpperCase();
  // Polar amounts are integer minor units (e.g. cents) for common currencies.
  const major = amountMinor / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(major);
}


function formatUSD(amount: number) {
  return amount === 0
    ? "$0"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
      amount
    );
}

type SubscriptionData = {
  plan_id: string | null;
  status: string | null;
  price_lookup_key?: string | null;
  price_id?: string | null;
  latest_invoice_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  trial_end?: string | null;
  cancel_at_period_end?: boolean | null;
  collection_method?: string | null;
};

type SubscriptionRow = SubscriptionData & {
  stripe_customer_id: string | null;
};

export default async function SubscriptionPage() {
  const billingProvider = process.env.NEXT_PUBLIC_BILLING_PROVIDER || "stripe";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let current: SubscriptionData | null = null;
  let uiCustomerId: string | null = null;
  let uiSubscription: Stripe.Subscription | null = null;
  let uiInvoices: Stripe.Invoice[] = [];
  let polarOrders: PolarOrderWithInvoice[] = [];
  let usageSummary:
    | {
        locations: { used: number; limit: number };
        users: { used: number; limit: number };
        reservations: { used: number; limit: number };
        sms: { used: number; limit: number };
        windowStart: string;
        windowEnd: string;
      }
    | null = null;
  if (user && billingProvider === "polar") {
    // API-only sync: ensure our DB reflects Polar before rendering.
    try {
      await syncPolarSubscriptionForUser({ userId: user.id });
    } catch {
      // ignore; UI will fall back to cached DB row
    }
  }

  if (user) {
    // First, read any existing customer link from DB
    const { data: existingRow } = await supabase
      .from("subscriptions")
      .select("plan_id, status, price_lookup_key, price_id, latest_invoice_id, current_period_start, current_period_end, trial_end, cancel_at_period_end, collection_method, stripe_customer_id")
      .eq("user_id", user.id)
      .neq("status", "canceled")
      .maybeSingle();

    if (billingProvider !== "stripe") {
      // In Polar mode, we rely on the DB row maintained by Polar webhooks.
      current = (existingRow as SubscriptionData) || null;
    }

    // console.log("🔍 SUPABASE DATA - Existing subscription row:", {
    //   user_id: user.id,
    //   stripe_customer_id: existingRow?.stripe_customer_id,
    //   plan_id: existingRow?.plan_id,
    //   status: existingRow?.status,
    //   price_lookup_key: existingRow?.price_lookup_key
    // });

    // Refresh subscription from Stripe on page load
    if (billingProvider === "stripe") try {
      const stripe = getStripe();
      const existing = (existingRow as SubscriptionRow | null);
      let customerId: string | null = existing?.stripe_customer_id || null;

      // If we have a stored customer ID, use it directly
      if (customerId) {
        const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
        const activeLike = new Set(["active", "trialing", "past_due", "unpaid", "incomplete"]);
        const sorted = subs.data
          .slice()
          .sort((a: Stripe.Subscription, b: Stripe.Subscription) => (b.created || 0) - (a.created || 0));
        let sub = sorted.find((s) => activeLike.has(s.status as string)) || null;

        // If we found an active-like subscription from the list, try to retrieve it individually for complete data
        if (sub?.id) {
          try {
            // console.log("🔍 STRIPE DATA - Attempting to retrieve full subscription details for:", sub.id);
            const fullSub = await stripe.subscriptions.retrieve(sub.id);
            // console.log("🔍 STRIPE DATA - Full retrieved subscription:", fullSub);
            sub = fullSub;
          } catch (error) {
            // console.log("🔍 STRIPE DATA - Failed to retrieve full subscription:", error);
          }
        }

        // Always record the customer id
        uiCustomerId = customerId;

        if (sub) {
          uiSubscription = sub;
          const price = sub.items?.data?.[0]?.price || null;
          const priceLookupKey = (price?.lookup_key as string | null) || null;
          const metadataLookupKey = sub.metadata?.lookup_key || sub.metadata?.lookupKey || null;
          const lookupKey = metadataLookupKey || priceLookupKey;

          // Get plan_id directly from subscription metadata if available
          const metadataPlanId = sub.metadata?.plan_id || sub.metadata?.planId || null;

          // Log the complete subscription object to see all available fields
          // console.log("🔍 STRIPE DATA - Complete subscription object:", sub);

          // Get current period from subscription items (Stripe moved these fields to item level in March 2025)
          const firstItem = sub.items?.data?.[0];
          const itemCurrentPeriodStart = firstItem?.current_period_start;
          const itemCurrentPeriodEnd = firstItem?.current_period_end;

          // console.log("🔍 STRIPE DATA - Active subscription summary:", {
          //   id: sub.id,
          //   customer: sub.customer,
          //   status: sub.status,
          //   metadata: sub.metadata,
          //   metadata_plan_id: metadataPlanId,
          //   // Subscription-level period fields (deprecated since March 2025)
          //   subscription_current_period_start: (sub as any).current_period_start,
          //   subscription_current_period_end: (sub as any).current_period_end,
          //   // Item-level period fields (current approach)
          //   item_current_period_start: itemCurrentPeriodStart,
          //   item_current_period_end: itemCurrentPeriodEnd,
          //   start_date: sub.start_date,
          //   // Additional fields that might contain period info
          //   billing_cycle_anchor: (sub as any).billing_cycle_anchor,
          //   next_pending_invoice_item_invoice: sub.next_pending_invoice_item_invoice,
          //   pending_invoice_item_interval: sub.pending_invoice_item_interval,
          //   pending_update: sub.pending_update,
          //   schedule: sub.schedule,
          //   trial_end: (sub as any).trial_end,
          //   trial_start: sub.trial_start,
          //   cancel_at_period_end: (sub as any).cancel_at_period_end,
          //   canceled_at: sub.canceled_at,
          //   cancel_at: sub.cancel_at,
          //   ended_at: sub.ended_at,
          //   latest_invoice: sub.latest_invoice,
          //   collection_method: sub.collection_method,
          //   price_id: price?.id,
          //   price_amount: price?.unit_amount,
          //   price_currency: price?.currency,
          //   price_lookup_key: priceLookupKey,
          //   metadata_lookup_key: metadataLookupKey,
          //   final_lookup_key: lookupKey,
          //   // Subscription items data
          //   subscription_items: sub.items?.data?.map(item => ({
          //     id: item.id,
          //     price_id: item.price?.id,
          //     current_period_start: item.current_period_start,
          //     current_period_end: item.current_period_end,
          //     quantity: item.quantity
          //   }))
          // });

          // Derive plan id - prefer metadata, then productId mapping, then price amount matching, then lookup key
          let planId: string | null = null;

          // First priority: plan_id from subscription metadata
          if (metadataPlanId) {
            planId = metadataPlanId;
          }
          // Second priority: match by exact lookup key (now that we have clean keys like BASE/PREMIUM)
          else if (lookupKey) {
            const byLookup = (Object.values(plans) as typeof orderedPlans).find((p) => p.stripe.priceLookupKeyMonthly === lookupKey);
            planId = byLookup ? byLookup.id : null;
          }
          // Third priority: derive from price amount (robust if prices differ)
          else if (typeof price?.unit_amount === "number") {
            const amountEur = Math.round(price.unit_amount) / 100;
            const match = orderedPlans.find((p) => Math.round(p.priceMonthlyEUR * 100) === Math.round(amountEur * 100));
            planId = match ? match.id : null;
          }
          // Fourth priority: map by Stripe product id (least reliable if products share IDs, but good fallback for distinct products)
          else if (price?.product && typeof price.product === "string") {
            const productId = price.product as string;
            // Search in reverse order (Premium first) or just find relevant using filter? 
            // In shared product ID case, this is ambiguous. We rely on amount/key mostly. 
            // Only use if we haven't found a match yet.
            const byProduct = (Object.values(plans) as typeof orderedPlans).find((p) => p.stripe.productId === productId);
            planId = byProduct ? byProduct.id : null;
          }

          // console.log("🔍 DERIVED DATA - Plan identification:", {
          //   derived_plan_id: planId,
          //   metadata_plan_id: metadataPlanId,
          //   price_amount_eur: typeof price?.unit_amount === "number" ? Math.round(price.unit_amount) / 100 : null,
          //   lookup_key_used: lookupKey,
          //   plan_determined_by: metadataPlanId ? "metadata" : (typeof price?.unit_amount === "number" && planId !== null) ? "price_amount" : lookupKey ? "lookup_key" : "none"
          // });

          const admin = getAdminClient();
          // Resolve business for this user
          let businessId: string | undefined;
          try {
            const { data: owned } = await admin
              .from("businesses")
              .select("id")
              .eq("owner_user_id", user.id)
              .order("created_at", { ascending: true })
              .limit(1)
              .maybeSingle();
            businessId = owned?.id as string | undefined;
            if (!businessId) {
              const { data: memberOf } = await admin
                .from("memberships")
                .select("business_id")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true })
                .limit(1)
                .maybeSingle();
              businessId = (memberOf?.business_id as string | undefined) || undefined;
            }
          } catch { }
          const currentPeriodEndIso = (() => {
            // Use item-level current period (Stripe moved these fields in March 2025)
            const sec = itemCurrentPeriodEnd;
            return typeof sec === "number" ? new Date(sec * 1000).toISOString() : null;
          })();
          const currentPeriodStartIso = (() => {
            // Use item-level current period (Stripe moved these fields in March 2025)
            const sec = itemCurrentPeriodStart;
            return typeof sec === "number" ? new Date(sec * 1000).toISOString() : null;
          })();
          const trialEndIso = (() => {
            const sec = (sub as any).trial_end;
            return typeof sec === "number" ? new Date(sec * 1000).toISOString() : null;
          })();
          const billingCycleAnchorIso = (() => {
            const sec = (sub as any).billing_cycle_anchor;
            return typeof sec === "number" ? new Date(sec * 1000).toISOString() : null;
          })();
          await admin
            .from("subscriptions")
            .upsert(
              {
                user_id: user.id,
                business_id: businessId || null,
                stripe_customer_id: customerId,
                stripe_subscription_id: sub.id as string,
                plan_id: planId,
                price_lookup_key: lookupKey,
                price_id: (price?.id as string | undefined) || null,
                status: sub.status as string,
                latest_invoice_id: (sub.latest_invoice as string | undefined) || null,
                collection_method: (sub.collection_method as string | undefined) || null,
                billing_cycle_anchor: billingCycleAnchorIso,
                cancel_at_period_end: (sub as any).cancel_at_period_end ?? null,
                current_period_start: currentPeriodStartIso,
                current_period_end: currentPeriodEndIso,
                trial_end: trialEndIso,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );

          // console.log("💾 SUPABASE UPSERT - Data saved to database:", {
          //   user_id: user.id,
          //   business_id: businessId || null,
          //   stripe_customer_id: customerId,
          //   stripe_subscription_id: sub.id,
          //   plan_id: planId,
          //   price_lookup_key: lookupKey,
          //   price_id: price?.id || null,
          //   status: sub.status,
          //   latest_invoice_id: sub.latest_invoice || null,
          //   collection_method: sub.collection_method || null,
          //   billing_cycle_anchor: billingCycleAnchorIso,
          //   cancel_at_period_end: (sub as any).cancel_at_period_end ?? null,
          //   current_period_start: currentPeriodStartIso,
          //   current_period_end: currentPeriodEndIso,
          //   trial_end: trialEndIso
          // });

          // Use this immediately for rendering
          current = {
            plan_id: planId,
            status: sub.status as string,
            price_lookup_key: lookupKey,
            price_id: (price?.id as string | undefined) || null,
            latest_invoice_id: (sub.latest_invoice as string | undefined) || null,
            current_period_start: currentPeriodStartIso,
            current_period_end: currentPeriodEndIso,
            trial_end: trialEndIso,
            cancel_at_period_end: (sub as any).cancel_at_period_end ?? null,
            collection_method: (sub.collection_method as string | undefined) || null,
          };

          // console.log("🎨 RENDER DATA - Data used for UI rendering:", {
          //   plan_id: current.plan_id,
          //   status: current.status,
          //   price_lookup_key: current.price_lookup_key,
          //   price_id: current.price_id,
          //   latest_invoice_id: current.latest_invoice_id,
          //   current_period_start: current.current_period_start,
          //   current_period_end: current.current_period_end,
          //   trial_end: current.trial_end,
          //   cancel_at_period_end: current.cancel_at_period_end,
          //   collection_method: current.collection_method
          // });

        } else {
          // We found a customer but no active subscription. 
          // We must set 'current' to an inactive state to prevent falling back to stale DB data.
          current = {
            plan_id: null,
            status: "canceled",
            price_lookup_key: null,
            price_id: null,
            latest_invoice_id: null,
            current_period_start: null,
            current_period_end: null,
            trial_end: null,
            cancel_at_period_end: null,
            collection_method: null
          };
        }

        // Fetch recent invoices for payment history and last payment display even if no active subscription
        try {
          const invoices = await stripe.invoices.list({ customer: customerId, limit: 12 });
          uiInvoices = invoices.data
            .slice()
            .sort((a: Stripe.Invoice, b: Stripe.Invoice) => (b.created || 0) - (a.created || 0));
        } catch { }
      } else {
        // If we don't have a stored customer ID, try to find it through other means
        // Try Stripe search API on subscriptions by metadata user_id
        try {
          const search = await (stripe.subscriptions as unknown as {
            search: (params: { query: string; limit: number }) => Promise<{ data: Stripe.Subscription[] }>;
          }).search?.({ query: `metadata['user_id']:'${user.id}' OR metadata['userId']:'${user.id}'`, limit: 1 });
          const found = search?.data?.[0];
          if (found) {
            customerId = (found.customer as string) || null;
            if (customerId) {
              // Recursively get subscription data for this newly found customer
              const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
              const activeLike = new Set(["active", "trialing", "past_due", "unpaid", "incomplete"]);
              const sorted = subs.data
                .slice()
                .sort((a: Stripe.Subscription, b: Stripe.Subscription) => (b.created || 0) - (a.created || 0));
              let sub = sorted.find((s) => activeLike.has(s.status as string)) || null;

              // Try to retrieve full subscription details
              if (sub?.id) {
                try {
                  sub = await stripe.subscriptions.retrieve(sub.id);
                } catch (error) {
                  // console.log("🔍 STRIPE DATA - Failed to retrieve full subscription in fallback:", error);
                }
              }

              // Always record the customer id
              uiCustomerId = customerId;

              if (sub) {
                uiCustomerId = customerId;
                uiSubscription = sub;
                const price = sub.items?.data?.[0]?.price || null;
                const priceLookupKey = (price?.lookup_key as string | null) || null;
                const metadataLookupKey = sub.metadata?.lookup_key || sub.metadata?.lookupKey || null;
                const lookupKey = metadataLookupKey || priceLookupKey;

                // Get plan_id directly from subscription metadata if available
                const metadataPlanId = sub.metadata?.plan_id || sub.metadata?.planId || null;

                // Get current period from subscription items (Stripe moved these fields to item level in March 2025)
                const firstItem = sub.items?.data?.[0];
                const itemCurrentPeriodStart = firstItem?.current_period_start;
                const itemCurrentPeriodEnd = firstItem?.current_period_end;

                // Derive plan id - prefer metadata, then productId mapping, then price amount matching, then lookup key
                let planId: string | null = null;

                // First priority: plan_id from subscription metadata
                if (metadataPlanId) {
                  planId = metadataPlanId;
                }
                // Second priority: map by Stripe product id
                else if (price?.product && typeof price.product === "string") {
                  const productId = price.product as string;
                  const byProduct = (Object.values(plans) as typeof orderedPlans).find((p) => p.stripe.productId === productId);
                  planId = byProduct ? byProduct.id : null;
                }
                // Third priority: derive from price amount
                else if (typeof price?.unit_amount === "number") {
                  const amountEur = Math.round(price.unit_amount) / 100;
                  const match = orderedPlans.find((p) => Math.round(p.priceMonthlyEUR * 100) === Math.round(amountEur * 100));
                  planId = match ? match.id : null;
                }
                // Fourth priority: derive from lookup key
                else if (lookupKey) {
                  planId = lookupKey.replace(/_monthly_eur$/, "").replace(/^waitq_/, "");
                }

                const admin = getAdminClient();
                // Resolve business for this user
                let businessId: string | undefined;
                try {
                  const { data: owned } = await admin
                    .from("businesses")
                    .select("id")
                    .eq("owner_user_id", user.id)
                    .order("created_at", { ascending: true })
                    .limit(1)
                    .maybeSingle();
                  businessId = owned?.id as string | undefined;
                  if (!businessId) {
                    const { data: memberOf } = await admin
                      .from("memberships")
                      .select("business_id")
                      .eq("user_id", user.id)
                      .order("created_at", { ascending: true })
                      .limit(1)
                      .maybeSingle();
                    businessId = (memberOf?.business_id as string | undefined) || undefined;
                  }
                } catch { }

                const currentPeriodEndIso = (() => {
                  // Use item-level current period (Stripe moved these fields in March 2025)
                  const sec = itemCurrentPeriodEnd;
                  return typeof sec === "number" ? new Date(sec * 1000).toISOString() : null;
                })();
                const currentPeriodStartIso = (() => {
                  // Use item-level current period (Stripe moved these fields in March 2025)
                  const sec = itemCurrentPeriodStart;
                  return typeof sec === "number" ? new Date(sec * 1000).toISOString() : null;
                })();
                const trialEndIso = (() => {
                  const sec = (sub as any).trial_end;
                  return typeof sec === "number" ? new Date(sec * 1000).toISOString() : null;
                })();
                const billingCycleAnchorIso = (() => {
                  const sec = (sub as any).billing_cycle_anchor;
                  return typeof sec === "number" ? new Date(sec * 1000).toISOString() : null;
                })();
                await admin
                  .from("subscriptions")
                  .upsert(
                    {
                      user_id: user.id,
                      business_id: businessId || null,
                      stripe_customer_id: customerId,
                      stripe_subscription_id: sub.id as string,
                      plan_id: planId,
                      price_lookup_key: price?.lookup_key || null,
                      price_id: (price?.id as string | undefined) || null,
                      status: sub.status as string,
                      latest_invoice_id: (sub.latest_invoice as string | undefined) || null,
                      collection_method: (sub.collection_method as string | undefined) || null,
                      billing_cycle_anchor: billingCycleAnchorIso,
                      cancel_at_period_end: (sub as any).cancel_at_period_end ?? null,
                      current_period_start: currentPeriodStartIso,
                      current_period_end: currentPeriodEndIso,
                      trial_end: trialEndIso,
                      updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id" }
                  );

                // Use this immediately for rendering
                current = {
                  plan_id: planId,
                  status: sub.status as string,
                  price_lookup_key: price?.lookup_key || null,
                  price_id: (price?.id as string | undefined) || null,
                  latest_invoice_id: (sub.latest_invoice as string | undefined) || null,
                  current_period_start: currentPeriodStartIso,
                  current_period_end: currentPeriodEndIso,
                  trial_end: trialEndIso,
                  cancel_at_period_end: (sub as any).cancel_at_period_end ?? null,
                  collection_method: (sub.collection_method as string | undefined) || null,
                };

              }
              // Fetch recent invoices for payment history and last payment display
              try {
                const invoices = await stripe.invoices.list({ customer: customerId, limit: 12 });
                uiInvoices = invoices.data
                  .slice()
                  .sort((a: Stripe.Invoice, b: Stripe.Invoice) => (b.created || 0) - (a.created || 0));
              } catch { }
            }
          }
        } catch { }

        if (!customerId) {
          // Final fallback to email lookup
          const custList = await stripe.customers.list({ email: user.email ?? undefined, limit: 1 });
          customerId = custList.data?.[0]?.id ?? null;
          if (customerId) {
            // Recursively get subscription data for this newly found customer
            const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
            const activeLike = new Set(["active", "trialing", "past_due", "unpaid", "incomplete"]);
            const sorted = subs.data
              .slice()
              .sort((a: Stripe.Subscription, b: Stripe.Subscription) => (b.created || 0) - (a.created || 0));
            let sub = sorted.find((s) => activeLike.has(s.status as string)) || sorted[0] || null;

            // Try to retrieve full subscription details
            if (sub?.id) {
              try {
                sub = await stripe.subscriptions.retrieve(sub.id);
              } catch (error) {
                // console.log("🔍 STRIPE DATA - Failed to retrieve full subscription in email fallback:", error);
              }
            }

            if (sub) {
              uiCustomerId = customerId;
              uiSubscription = sub;
              const price = sub.items?.data?.[0]?.price || null;
              const priceLookupKey = (price?.lookup_key as string | null) || null;
              const metadataLookupKey = sub.metadata?.lookup_key || sub.metadata?.lookupKey || null;
              const lookupKey = metadataLookupKey || priceLookupKey;

              // Get plan_id directly from subscription metadata if available
              const metadataPlanId = sub.metadata?.plan_id || sub.metadata?.planId || null;

              // Get current period from subscription items (Stripe moved these fields to item level in March 2025)
              const firstItem = sub.items?.data?.[0];
              const itemCurrentPeriodStart = firstItem?.current_period_start;
              const itemCurrentPeriodEnd = firstItem?.current_period_end;

              // Derive plan id - prefer metadata, then productId mapping, then price amount matching, then lookup key
              let planId: string | null = null;

              // First priority: plan_id from subscription metadata
              if (metadataPlanId) {
                planId = metadataPlanId;
              }
              // Second priority: map by Stripe product id
              else if (price?.product && typeof price.product === "string") {
                const productId = price.product as string;
                const byProduct = (Object.values(plans) as typeof orderedPlans).find((p) => p.stripe.productId === productId);
                planId = byProduct ? byProduct.id : null;
              }
              // Third priority: derive from price amount
              else if (typeof price?.unit_amount === "number") {
                const amountEur = Math.round(price.unit_amount) / 100;
                const match = orderedPlans.find((p) => Math.round(p.priceMonthlyEUR * 100) === Math.round(amountEur * 100));
                planId = match ? match.id : null;
              }
              // Fourth priority: derive from lookup key
              else if (lookupKey) {
                planId = lookupKey.replace(/_monthly_eur$/, "").replace(/^waitq_/, "");
              }

              const admin = getAdminClient();
              // Resolve business for this user
              let businessId: string | undefined;
              try {
                const { data: owned } = await admin
                  .from("businesses")
                  .select("id")
                  .eq("owner_user_id", user.id)
                  .order("created_at", { ascending: true })
                  .limit(1)
                  .maybeSingle();
                businessId = owned?.id as string | undefined;
                if (!businessId) {
                  const { data: memberOf } = await admin
                    .from("memberships")
                    .select("business_id")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: true })
                    .limit(1)
                    .maybeSingle();
                  businessId = (memberOf?.business_id as string | undefined) || undefined;
                }
              } catch { }

              const currentPeriodEndIso = (() => {
                // Use item-level current period (Stripe moved these fields in March 2025)
                const sec = itemCurrentPeriodEnd;
                return typeof sec === "number" ? new Date(sec * 1000).toISOString() : null;
              })();
              const currentPeriodStartIso = (() => {
                // Use item-level current period (Stripe moved these fields in March 2025)
                const sec = itemCurrentPeriodStart;
                return typeof sec === "number" ? new Date(sec * 1000).toISOString() : null;
              })();
              const trialEndIso = (() => {
                const sec = (sub as any).trial_end;
                return typeof sec === "number" ? new Date(sec * 1000).toISOString() : null;
              })();
              const billingCycleAnchorIso = (() => {
                const sec = (sub as any).billing_cycle_anchor;
                return typeof sec === "number" ? new Date(sec * 1000).toISOString() : null;
              })();
              await admin
                .from("subscriptions")
                .upsert(
                  {
                    user_id: user.id,
                    business_id: businessId || null,
                    stripe_customer_id: customerId,
                    stripe_subscription_id: sub.id as string,
                    plan_id: planId,
                    price_lookup_key: price?.lookup_key || null,
                    price_id: (price?.id as string | undefined) || null,
                    status: sub.status as string,
                    latest_invoice_id: (sub.latest_invoice as string | undefined) || null,
                    collection_method: (sub.collection_method as string | undefined) || null,
                    billing_cycle_anchor: billingCycleAnchorIso,
                    cancel_at_period_end: (sub as any).cancel_at_period_end ?? null,
                    current_period_start: currentPeriodStartIso,
                    current_period_end: currentPeriodEndIso,
                    trial_end: trialEndIso,
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: "user_id" }
                );

              // Use this immediately for rendering
              current = {
                plan_id: planId,
                status: sub.status as string,
                price_lookup_key: price?.lookup_key || null,
                price_id: (price?.id as string | undefined) || null,
                latest_invoice_id: (sub.latest_invoice as string | undefined) || null,
                current_period_start: currentPeriodStartIso,
                current_period_end: currentPeriodEndIso,
                trial_end: trialEndIso,
                cancel_at_period_end: (sub as any).cancel_at_period_end ?? null,
                collection_method: (sub.collection_method as string | undefined) || null,
              };

              // Fetch recent invoices for payment history and last payment display
              try {
                const invoices = await stripe.invoices.list({ customer: customerId, limit: 12 });
                uiInvoices = invoices.data
                  .slice()
                  .sort((a: Stripe.Invoice, b: Stripe.Invoice) => (b.created || 0) - (a.created || 0));
              } catch { }
            }
          }
        }
      }
    } catch { }

    if (!current) {
      const { data } = await supabase
        .from("subscriptions")
        .select("plan_id, status, price_lookup_key, price_id, latest_invoice_id, current_period_start, current_period_end, trial_end, cancel_at_period_end, collection_method")
        .eq("user_id", user.id)
        .neq("status", "canceled") // Explicitly exclude canceled
        .in("status", ["active", "trialing", "past_due", "unpaid", "incomplete"]) // Only valid statuses
        .maybeSingle();
      current = (data as SubscriptionData) || null;

      // console.log("📚 FALLBACK SUPABASE DATA - Using cached data from database:", {
      //   user_id: user.id,
      //   plan_id: current?.plan_id,
      //   status: current?.status,
      //   price_lookup_key: current?.price_lookup_key,
      //   price_id: current?.price_id,
      //   latest_invoice_id: current?.latest_invoice_id,
      //   current_period_start: current?.current_period_start,
      //   current_period_end: current?.current_period_end,
      //   trial_end: current?.trial_end,
      //   cancel_at_period_end: current?.cancel_at_period_end,
      //   collection_method: current?.collection_method
      // });
    }
  }

  // Polar payment history (orders) for this user
  if (billingProvider === "polar" && user) {
    try {
      const token = process.env.POLAR_ACCESS_TOKEN;
      if (token) {
        const listUrl = new URL("/v1/orders", polarApiBase());
        listUrl.searchParams.set("limit", "12");
        listUrl.searchParams.set("sorting", "-created_at");
        // We attach `metadata.user_id` to checkout, so this reliably filters per user.
        listUrl.searchParams.set("metadata[user_id]", user.id);

        const res = await fetch(listUrl.toString(), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.ok) {
          const json = (await res.json()) as { items?: PolarOrder[] };
          const items = Array.isArray(json.items) ? json.items : [];

          // Best-effort: fetch invoice URL for generated invoices.
          polarOrders = await Promise.all(
            items.map(async (o) => {
              let invoiceUrl: string | null = null;
              if (o.is_invoice_generated) {
                try {
                  const invUrl = new URL(`/v1/orders/${o.id}/invoice`, polarApiBase());
                  const invRes = await fetch(invUrl.toString(), {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                  });
                  if (invRes.ok) {
                    const invJson = (await invRes.json()) as { url?: string | null };
                    invoiceUrl = typeof invJson.url === "string" ? invJson.url : null;
                  }
                } catch {
                  // ignore
                }
              }
              return { ...o, invoiceUrl };
            })
          );
        }
      }
    } catch {
      // ignore
    }
  }

  if (user) {
    try {
      const admin = getAdminClient();
      let businessId: string | null = null;
      const { data: owned } = await admin
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      businessId = (owned?.id as string | undefined) || null;
      if (!businessId) {
        const { data: memberOf } = await admin
          .from("memberships")
          .select("business_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        businessId = (memberOf?.business_id as string | undefined) || null;
      }
      if (businessId) {
        const { data: bizOwner } = await admin
          .from("businesses")
          .select("owner_user_id")
          .eq("id", businessId)
          .maybeSingle();
        const ctx = await getPlanContext(businessId);
        const memberCountPromise = (() => {
          let q = admin
            .from("memberships")
            .select("id", { count: "exact", head: true })
            .eq("business_id", businessId)
            .eq("status", "active");
          const ownerId = (bizOwner?.owner_user_id as string | undefined) || null;
          if (ownerId) q = q.neq("user_id", ownerId);
          return q.then((res) => res.count || 0);
        })();

        const [usedLocations, usedReservations, usedSms, memberCount] = await Promise.all([
          countLocations(businessId),
          countEntriesInPeriod(businessId, ctx.window.start, ctx.window.end),
          countSmsInPeriod(businessId, ctx.window.start, ctx.window.end),
          memberCountPromise,
        ]);
        const usedUsers = (bizOwner?.owner_user_id ? 1 : 0) + memberCount;
        usageSummary = {
          locations: { used: usedLocations, limit: ctx.limits.locations },
          users: { used: usedUsers, limit: ctx.limits.users },
          reservations: { used: usedReservations, limit: ctx.limits.reservationsPerMonth },
          sms: { used: usedSms, limit: ctx.limits.messagesPerMonth },
          windowStart: ctx.window.start.toISOString(),
          windowEnd: ctx.window.end.toISOString(),
        };
      }
    } catch { }
  }

  // Determine current plan - consider common paid/trial statuses
  // Exclude 'incomplete' and 'unpaid' so users with failed/pending subs don't see them as active
  const activeLikeStatuses =
    billingProvider === "polar"
      ? new Set(["active", "trialing", "past_due", "paid", "confirmed", "complete", "completed", "succeeded"])
      : new Set(["active", "trialing", "past_due"]);
  let currentPlanId: string = "free";
  if (current && current.status && activeLikeStatuses.has(current.status)) {
    // Prefer the plan_id we derived from Stripe subscription data, fallback to lookup key matching
    if (current.plan_id) {
      currentPlanId = current.plan_id;
    } else {
      // Fallback to lookup key matching if plan_id is not set
      const matchByLookup = current.price_lookup_key
        ? orderedPlans.find((p) => p.stripe.priceLookupKeyMonthly === current!.price_lookup_key)
        : undefined;
      if (matchByLookup) currentPlanId = matchByLookup.id;
    }
  }

  // console.log("🎯 FINAL PLAN DETERMINATION:", {
  //   user_id: user?.id,
  //   has_active_subscription: current && current.status && activeLikeStatuses.has(current.status),
  //   current_subscription_status: current?.status,
  //   derived_plan_id: current?.plan_id,
  //   final_current_plan: currentPlanId,
  //   plan_determined_by: current?.plan_id ? "metadata_or_price_derivation" : "default_free"
  // });

  const hasActiveSubscription = !!(uiSubscription && uiSubscription.status && activeLikeStatuses.has(uiSubscription.status as string));

  return (
    <main className="py-5">
      <SubscriptionReturnRefresh />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Subscription</h1>

          </div>
        </div>

        <PlanCards mode="manage" currentPlanId={currentPlanId} billingProvider={billingProvider === "polar" ? "polar" : "stripe"} />

        <div className="grid grid-cols-1 gap-4">
          {billingProvider === "stripe" && hasActiveSubscription && uiSubscription && (
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xl font-semibold">Active Subscription</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

                <div>
                  <div className="text-muted-foreground">Current period</div>
                  <div className="font-medium">
                    {(() => {
                      const firstItem = (uiSubscription as any).items?.data?.[0];
                      const startSec = firstItem?.current_period_start;
                      const endSec = firstItem?.current_period_end;
                      if (typeof startSec !== "number" || typeof endSec !== "number") return "Not set";
                      const startDate = new Date(startSec * 1000);
                      const endDate = new Date(endSec * 1000);
                      const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      return `${formatDate(startDate)} to ${formatDate(endDate)}`;
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Days Left</div>
                  <div className="font-medium">
                    {(() => {
                      const firstItem = (uiSubscription as any).items?.data?.[0];
                      const endSec = firstItem?.current_period_end;
                      if (typeof endSec !== "number") return "Not set";
                      const msLeft = endSec * 1000 - Date.now();
                      const days = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
                      return `${days} day${days === 1 ? "" : "s"}`;
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Auto-renew</div>
                  <div className="font-medium">
                    {(() => {
                      const val = (uiSubscription as any).cancel_at_period_end;
                      if (typeof val !== 'boolean') return 'Not set';
                      return val ? 'Off' : 'On';
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Payment</div>
                  <div className="font-medium">
                    {(() => {
                      const lastPaid = uiInvoices.find((inv) => inv.status === "paid");
                      const paidAt = (lastPaid?.status_transitions?.paid_at as number | undefined) || (lastPaid?.created as number | undefined);
                      return paidAt ? <DateTimeText value={paidAt * 1000} /> : "No payments yet";
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {usageSummary ? (
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
              <div className="text-lg font-semibold mb-3">Usage</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {[
                  { label: "Locations", value: usageSummary.locations },
                  { label: "Users", value: usageSummary.users },
                  { label: "Reservations", value: usageSummary.reservations },
                  { label: "SMS", value: usageSummary.sms },
                ].map((item) => {
                  const pct = item.value.limit > 0 ? Math.min(100, Math.round((item.value.used / item.value.limit) * 100)) : 0;
                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-muted-foreground">{item.label}</div>
                        <div className="font-medium">{item.value.used} / {item.value.limit}</div>
                      </div>
                      <Progress value={pct} />
                    </div>
                  );
                })}
                {currentPlanId !== "free" ? (
                  <div className="md:col-span-2">
                    <div className="text-muted-foreground">Usage period</div>
                    <div className="font-medium">
                      {new Date(usageSummary.windowStart).toLocaleDateString()} - {new Date(usageSummary.windowEnd).toLocaleDateString()}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {billingProvider === "stripe" ? (
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
              <div className="text-lg font-semibold mb-3">Payment History</div>
              {uiInvoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uiInvoices.map((inv) => (
                        <tr key={inv.id} className="border-t border-border/60">
                          <td className="py-2 pr-4"><DateTimeText value={(inv.created || 0) * 1000} /></td>
                          <td className="py-2 pr-4">{formatUSD(((inv.amount_paid || inv.amount_due || 0) as number) / 100)}</td>
                          <td className="py-2 pr-4 capitalize">{inv.status as string}</td>
                          <td className="py-2 pr-4">
                            {inv.hosted_invoice_url ? (
                              <a className="text-primary underline" href={inv.hosted_invoice_url} target="_blank" rel="noreferrer">View</a>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-2">No payment history yet.</div>
              )}
            </div>
          ) : billingProvider === "polar" ? (
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
              <div className="text-lg font-semibold mb-3">Payment History</div>
              {polarOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {polarOrders.map((o) => (
                        <tr key={o.id} className="border-t border-border/60">
                          <td className="py-2 pr-4"><DateTimeText value={new Date(o.created_at).getTime()} /></td>
                          <td className="py-2 pr-4">{formatCurrencyMinor(o.total_amount || 0, o.currency || "eur")}</td>
                          <td className="py-2 pr-4 capitalize">{o.status}</td>
                          <td className="py-2 pr-4">
                            {o.invoiceUrl ? (
                              <a className="text-primary underline" href={o.invoiceUrl} target="_blank" rel="noreferrer">View</a>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-2">No payment history yet.</div>
              )}
            </div>
          ) : (
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
              <div className="text-lg font-semibold mb-2">Payment History</div>
              <div className="text-sm text-muted-foreground">
                Payment history is only available in Stripe mode right now.
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}


