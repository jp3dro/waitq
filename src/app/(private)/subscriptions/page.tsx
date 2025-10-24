export const metadata = { title: "Subscription" };
export const dynamic = "force-dynamic";

import Link from "next/link";
import { orderedPlans } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import SubscribeButton from "./subscribe-button";
import { getStripe } from "@/lib/stripe";
import { getAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";


function formatEUR(amount: number) {
  return amount === 0
    ? "€0"
    : new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let current: SubscriptionData | null = null;
  let uiCustomerId: string | null = null;
  let uiSubscription: Stripe.Subscription | null = null;
  let uiInvoices: Stripe.Invoice[] = [];
  if (user) {
    // First, read any existing customer link from DB
    const { data: existingRow } = await supabase
      .from("subscriptions")
      .select("plan_id, status, price_lookup_key, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("🔍 SUPABASE DATA - Existing subscription row:", {
      user_id: user.id,
      stripe_customer_id: existingRow?.stripe_customer_id,
      plan_id: existingRow?.plan_id,
      status: existingRow?.status,
      price_lookup_key: existingRow?.price_lookup_key
    });

    // Refresh subscription from Stripe on page load
    try {
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
        let sub = sorted.find((s) => activeLike.has(s.status as string)) || sorted[0] || null;

        // If we found a subscription from the list, try to retrieve it individually for complete data
        if (sub?.id) {
          try {
            console.log("🔍 STRIPE DATA - Attempting to retrieve full subscription details for:", sub.id);
            const fullSub = await stripe.subscriptions.retrieve(sub.id);
            console.log("🔍 STRIPE DATA - Full retrieved subscription:", fullSub);
            sub = fullSub;
          } catch (error) {
            console.log("🔍 STRIPE DATA - Failed to retrieve full subscription:", error);
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

          // Log the complete subscription object to see all available fields
          console.log("🔍 STRIPE DATA - Complete subscription object:", sub);

          // Get current period from subscription items (Stripe moved these fields to item level in March 2025)
          const firstItem = sub.items?.data?.[0];
          const itemCurrentPeriodStart = firstItem?.current_period_start;
          const itemCurrentPeriodEnd = firstItem?.current_period_end;

          console.log("🔍 STRIPE DATA - Active subscription summary:", {
            id: sub.id,
            customer: sub.customer,
            status: sub.status,
            metadata: sub.metadata,
            metadata_plan_id: metadataPlanId,
            // Subscription-level period fields (deprecated since March 2025)
            subscription_current_period_start: (sub as any).current_period_start,
            subscription_current_period_end: (sub as any).current_period_end,
            // Item-level period fields (current approach)
            item_current_period_start: itemCurrentPeriodStart,
            item_current_period_end: itemCurrentPeriodEnd,
            start_date: sub.start_date,
            // Additional fields that might contain period info
            billing_cycle_anchor: (sub as any).billing_cycle_anchor,
            next_pending_invoice_item_invoice: sub.next_pending_invoice_item_invoice,
            pending_invoice_item_interval: sub.pending_invoice_item_interval,
            pending_update: sub.pending_update,
            schedule: sub.schedule,
            trial_end: (sub as any).trial_end,
            trial_start: sub.trial_start,
            cancel_at_period_end: (sub as any).cancel_at_period_end,
            canceled_at: sub.canceled_at,
            cancel_at: sub.cancel_at,
            ended_at: sub.ended_at,
            latest_invoice: sub.latest_invoice,
            collection_method: sub.collection_method,
            price_id: price?.id,
            price_amount: price?.unit_amount,
            price_currency: price?.currency,
            price_lookup_key: priceLookupKey,
            metadata_lookup_key: metadataLookupKey,
            final_lookup_key: lookupKey,
            // Subscription items data
            subscription_items: sub.items?.data?.map(item => ({
              id: item.id,
              price_id: item.price?.id,
              current_period_start: item.current_period_start,
              current_period_end: item.current_period_end,
              quantity: item.quantity
            }))
          });

          // Derive plan id - prefer metadata, then price amount matching, then lookup key
          let planId: string | null = null;

          // First priority: plan_id from subscription metadata
          if (metadataPlanId) {
            planId = metadataPlanId;
          }
          // Second priority: derive from price amount
          else if (typeof price?.unit_amount === "number") {
            const amountEur = Math.round(price.unit_amount) / 100;
            const match = orderedPlans.find((p) => Math.round(p.priceMonthlyEUR * 100) === Math.round(amountEur * 100));
            planId = match ? match.id : null;
          }
          // Third priority: derive from lookup key
          else if (lookupKey) {
            planId = lookupKey.replace(/_monthly_eur$/, "").replace(/^waitq_/, "");
          }

          console.log("🔍 DERIVED DATA - Plan identification:", {
            derived_plan_id: planId,
            metadata_plan_id: metadataPlanId,
            price_amount_eur: typeof price?.unit_amount === "number" ? Math.round(price.unit_amount) / 100 : null,
            lookup_key_used: lookupKey,
            plan_determined_by: metadataPlanId ? "metadata" : (typeof price?.unit_amount === "number" && planId !== null) ? "price_amount" : lookupKey ? "lookup_key" : "none"
          });

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
          } catch {}
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

          console.log("💾 SUPABASE UPSERT - Data saved to database:", {
            user_id: user.id,
            business_id: businessId || null,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            plan_id: planId,
            price_lookup_key: lookupKey,
            price_id: price?.id || null,
            status: sub.status,
            latest_invoice_id: sub.latest_invoice || null,
            collection_method: sub.collection_method || null,
            billing_cycle_anchor: billingCycleAnchorIso,
            cancel_at_period_end: (sub as any).cancel_at_period_end ?? null,
            current_period_start: currentPeriodStartIso,
            current_period_end: currentPeriodEndIso,
            trial_end: trialEndIso
          });

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

          console.log("🎨 RENDER DATA - Data used for UI rendering:", {
            plan_id: current.plan_id,
            status: current.status,
            price_lookup_key: current.price_lookup_key,
            price_id: current.price_id,
            latest_invoice_id: current.latest_invoice_id,
            current_period_start: current.current_period_start,
            current_period_end: current.current_period_end,
            trial_end: current.trial_end,
            cancel_at_period_end: current.cancel_at_period_end,
            collection_method: current.collection_method
          });

          // Fetch recent invoices for payment history and last payment display
          try {
            const invoices = await stripe.invoices.list({ customer: customerId, limit: 12 });
            uiInvoices = invoices.data
              .slice()
              .sort((a: Stripe.Invoice, b: Stripe.Invoice) => (b.created || 0) - (a.created || 0));
          } catch {}
        }
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
              let sub = sorted.find((s) => activeLike.has(s.status as string)) || sorted[0] || null;

              // Try to retrieve full subscription details
              if (sub?.id) {
                try {
                  sub = await stripe.subscriptions.retrieve(sub.id);
                } catch (error) {
                  console.log("🔍 STRIPE DATA - Failed to retrieve full subscription in fallback:", error);
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

                // Derive plan id - prefer metadata, then price amount matching, then lookup key
                let planId: string | null = null;

                // First priority: plan_id from subscription metadata
                if (metadataPlanId) {
                  planId = metadataPlanId;
                }
                // Second priority: derive from price amount
                else if (typeof price?.unit_amount === "number") {
                  const amountEur = Math.round(price.unit_amount) / 100;
                  const match = orderedPlans.find((p) => Math.round(p.priceMonthlyEUR * 100) === Math.round(amountEur * 100));
                  planId = match ? match.id : null;
                }
                // Third priority: derive from lookup key
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
                } catch {}

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
                } catch {}
              }
            }
          }
        } catch {}

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
                console.log("🔍 STRIPE DATA - Failed to retrieve full subscription in email fallback:", error);
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

              // Derive plan id - prefer metadata, then price amount matching, then lookup key
              let planId: string | null = null;

              // First priority: plan_id from subscription metadata
              if (metadataPlanId) {
                planId = metadataPlanId;
              }
              // Second priority: derive from price amount
              else if (typeof price?.unit_amount === "number") {
                const amountEur = Math.round(price.unit_amount) / 100;
                const match = orderedPlans.find((p) => Math.round(p.priceMonthlyEUR * 100) === Math.round(amountEur * 100));
                planId = match ? match.id : null;
              }
              // Third priority: derive from lookup key
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
              } catch {}

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
              } catch {}
            }
          }
        }
      }
    } catch {}

    if (!current) {
      const { data } = await supabase
        .from("subscriptions")
        .select("plan_id, status, price_lookup_key, price_id, latest_invoice_id, current_period_start, current_period_end, trial_end, cancel_at_period_end, collection_method")
        .eq("user_id", user.id)
        .maybeSingle();
      current = (data as SubscriptionData) || null;

      console.log("📚 FALLBACK SUPABASE DATA - Using cached data from database:", {
        user_id: user.id,
        plan_id: current?.plan_id,
        status: current?.status,
        price_lookup_key: current?.price_lookup_key,
        price_id: current?.price_id,
        latest_invoice_id: current?.latest_invoice_id,
        current_period_start: current?.current_period_start,
        current_period_end: current?.current_period_end,
        trial_end: current?.trial_end,
        cancel_at_period_end: current?.cancel_at_period_end,
        collection_method: current?.collection_method
      });
    }
  }

  // Determine current plan - consider common paid/trial statuses
  const activeLikeStatuses = new Set(["active", "trialing", "past_due", "unpaid", "incomplete"]);
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

  console.log("🎯 FINAL PLAN DETERMINATION:", {
    user_id: user?.id,
    has_active_subscription: current && current.status && activeLikeStatuses.has(current.status),
    current_subscription_status: current?.status,
    derived_plan_id: current?.plan_id,
    final_current_plan: currentPlanId,
    plan_determined_by: current?.plan_id ? "metadata_or_price_derivation" : "default_free"
  });

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your subscription and view available plans. Your current plan is highlighted below.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {orderedPlans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlanId;
            const isUpgradeable = currentPlanId !== "free" && plan.id !== currentPlanId && orderedPlans.findIndex(p => p.id === plan.id) > orderedPlans.findIndex(p => p.id === currentPlanId);
            return (
              <div key={plan.id} className={`bg-card text-card-foreground ring-1 rounded-xl p-6 flex flex-col justify-between relative ${
                isCurrentPlan
                  ? 'ring-primary/80 bg-accent/10'
                  : 'ring-border'
              }`}>
              <div className="grow">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    {isCurrentPlan && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {formatEUR(plan.priceMonthlyEUR)} <span className="text-sm font-normal">/ month</span>
                  </div>
                </div>
                <ul className="text-sm text-foreground/80 space-y-1">
                <li>{plan.limits.locations} locations</li>
                <li>{plan.limits.users} users</li>
                <li>
                  {plan.limits.reservationsPerMonth} reservations/queues per month
                </li>
                <li>{plan.limits.messagesPerMonth} SMS/emails per month</li>
                {plan.features.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
              </div>
              <div className="mt-4">
                {plan.priceMonthlyEUR === 0 ? (
                  // Hide "Included" button when user has an active subscription (any paid plan)
                  currentPlanId !== "free" ? null : (
                    isCurrentPlan ? null : (
                      <Link
                        href="/dashboard"
                        className="action-btn action-btn--primary w-full justify-center"
                      >
                        Included
                      </Link>
                    )
                  )
                ) : (
                  <SubscribeButton
                    lookupKey={plan.stripe.priceLookupKeyMonthly}
                    planId={plan.id}
                    className={`action-btn action-btn--primary w-full justify-center`}
                  >
                    {isCurrentPlan ? 'Manage' : (isUpgradeable ? 'Upgrade' : 'Subscribe')}
                  </SubscribeButton>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {uiSubscription && (
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xl font-semibold">Active Subscription</div>
                <span className="text-sm px-2 py-1 rounded bg-muted text-muted-foreground capitalize">{uiSubscription.status as string}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Stripe Customer</div>
                  <div className="font-medium break-all">{uiCustomerId}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Current period</div>
                  <div className="font-medium">
                    {(() => {
                      // Use item-level current period (Stripe moved these fields in March 2025)
                      const firstItem = (uiSubscription as any).items?.data?.[0];
                      const startSec = firstItem?.current_period_start;
                      const endSec = firstItem?.current_period_end;

                      if (typeof startSec !== "number" || typeof endSec !== "number") return "Not set";

                      const startDate = new Date(startSec * 1000);
                      const endDate = new Date(endSec * 1000);

                      const formatDate = (date: Date) => {
                        return date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        });
                      };

                      return `${formatDate(startDate)} to ${formatDate(endDate)}`;
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Days Left</div>
                  <div className="font-medium">
                    {(() => {
                      // Use item-level current period end (Stripe moved these fields in March 2025)
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
                      return paidAt ? new Date(paidAt * 1000).toLocaleString() : "No payments yet";
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
              <div className="text-lg font-semibold mb-3">Payment History</div>
              {uiInvoices.length === 0 ? (
                <div className="text-sm text-muted-foreground">No invoices yet.</div>
              ) : (
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
                          <td className="py-2 pr-4">{new Date((inv.created || 0) * 1000).toLocaleString()}</td>
                          <td className="py-2 pr-4">{formatEUR(((inv.amount_paid || inv.amount_due || 0) as number) / 100)}</td>
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
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


