import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Stripe } from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const buf = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) return NextResponse.json({}, { status: 400 });

  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      try {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string | null;
        const customerId = session.customer as string | null;
        const metadata = session.metadata || {};
        let userId = (metadata.user_id as string) || (metadata.userId as string) || null;
        let planId = (metadata.plan_id as string) || (metadata.planId as string) || null;
        let lookupKey = (metadata.lookup_key as string) || (metadata.lookupKey as string) || null;
        if (userId && subscriptionId) {
          const admin = getAdminClient();
          // Resolve business for this user (owned first, then membership)
          let businessId: string | undefined;
          try {
            const { data: owned } = await admin
              .from("businesses")
              .select("id")
              .eq("owner_user_id", userId)
              .order("created_at", { ascending: true })
              .limit(1)
              .maybeSingle();
            businessId = owned?.id as string | undefined;
            if (!businessId) {
              const { data: memberOf } = await admin
                .from("memberships")
                .select("business_id")
                .eq("user_id", userId)
                .order("created_at", { ascending: true })
                .limit(1)
                .maybeSingle();
              businessId = (memberOf?.business_id as string | undefined) || undefined;
            }
          } catch {}

          // Fetch full subscription details from Stripe for authoritative fields
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            const price = sub.items?.data?.[0]?.price || null;
            const actualLookupKey = (price?.lookup_key as string | null) || null;

            // Get current period from subscription items (Stripe moved these fields to item level in March 2025)
            const firstItem = sub.items?.data?.[0];
            const itemCurrentPeriodStart = firstItem?.current_period_start;
            const itemCurrentPeriodEnd = firstItem?.current_period_end;

            const currentPeriodEndIso = itemCurrentPeriodEnd ? new Date(itemCurrentPeriodEnd * 1000).toISOString() : null;
            const currentPeriodStartIso = itemCurrentPeriodStart ? new Date(itemCurrentPeriodStart * 1000).toISOString() : null;
            const billingCycleAnchorIso = (sub as any).billing_cycle_anchor ? new Date((sub as any).billing_cycle_anchor * 1000).toISOString() : null;
            const trialEndIso = (sub as any).trial_end ? new Date((sub as any).trial_end * 1000).toISOString() : null;

            // Use actual lookup key from price object, fallback to metadata if needed
            const finalLookupKey = actualLookupKey || lookupKey;

            await admin
              .from("subscriptions")
              .upsert(
                {
                  user_id: userId,
                  business_id: businessId || null,
                  stripe_customer_id: (sub.customer as string) || customerId,
                  stripe_subscription_id: sub.id as string,
                  plan_id: planId,
                  price_lookup_key: finalLookupKey,
                  price_id: (price?.id as string | undefined) || null,
                  latest_invoice_id: (sub.latest_invoice as string | undefined) || null,
                  discount_json: (sub.discount as any) || null,
                  collection_method: (sub.collection_method as string | undefined) || null,
                  billing_cycle_anchor: billingCycleAnchorIso,
                  cancel_at_period_end: typeof sub.cancel_at_period_end === "boolean" ? sub.cancel_at_period_end : null,
                  status: (sub.status as string) || "active",
                  current_period_start: currentPeriodStartIso,
                  current_period_end: currentPeriodEndIso,
                  trial_end: trialEndIso,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
              );
          } catch {}
        } else if (subscriptionId) {
          // Fallback: fetch subscription to get metadata (user_id) when not present on session
          try {
            const stripe = getStripe();
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            userId = (sub.metadata?.user_id as string) || (sub.metadata?.userId as string) || null;
            if (userId) {
              const price = sub.items?.data?.[0]?.price || null;
              const actualLookupKey = (price?.lookup_key as string | null) || null;
              // Use actual lookup key from price object
              lookupKey = actualLookupKey;
              if (!planId) {
                if (lookupKey) planId = lookupKey.replace(/_monthly_eur$/, "").replace(/^waitq_/, "");
              }

              // Get current period from subscription items (Stripe moved these fields to item level in March 2025)
              const firstItem = sub.items?.data?.[0];
              const itemCurrentPeriodStart = firstItem?.current_period_start;
              const itemCurrentPeriodEnd = firstItem?.current_period_end;

              const currentPeriodEndIso = itemCurrentPeriodEnd ? new Date(itemCurrentPeriodEnd * 1000).toISOString() : null;
              const currentPeriodStartIso = itemCurrentPeriodStart ? new Date(itemCurrentPeriodStart * 1000).toISOString() : null;
              const admin = getAdminClient();
              // Resolve business for this user (owned first, then membership)
              let businessId: string | undefined;
              try {
                const { data: owned } = await admin
                  .from("businesses")
                  .select("id")
                  .eq("owner_user_id", userId)
                  .order("created_at", { ascending: true })
                  .limit(1)
                  .maybeSingle();
                businessId = owned?.id as string | undefined;
                if (!businessId) {
                  const { data: memberOf } = await admin
                    .from("memberships")
                    .select("business_id")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: true })
                    .limit(1)
                    .maybeSingle();
                  businessId = (memberOf?.business_id as string | undefined) || undefined;
                }
              } catch {}

              await admin
                .from("subscriptions")
                .upsert(
                  {
                    user_id: userId,
                    business_id: businessId || null,
                    stripe_customer_id: (sub.customer as string) || customerId,
                    stripe_subscription_id: sub.id as string,
                    plan_id: planId,
                    price_lookup_key: lookupKey,
                    price_id: (price?.id as string | undefined) || null,
                    latest_invoice_id: (sub.latest_invoice as string | undefined) || null,
                    discount_json: (sub.discount as any) || null,
                    collection_method: (sub.collection_method as string | undefined) || null,
                    billing_cycle_anchor: (sub as any).billing_cycle_anchor ? new Date((sub as any).billing_cycle_anchor * 1000).toISOString() : null,
                    cancel_at_period_end: typeof sub.cancel_at_period_end === "boolean" ? sub.cancel_at_period_end : null,
                    status: sub.status as string,
                    current_period_start: currentPeriodStartIso,
                    current_period_end: currentPeriodEndIso,
                    trial_end: (sub as any).trial_end ? new Date((sub as any).trial_end * 1000).toISOString() : null,
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: "user_id" }
                );
            }
          } catch {}
        }
      } catch {}
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      try {
        const sub = event.data.object as Stripe.Subscription;
        const admin = getAdminClient();
        // We expect user id in subscription.metadata
        const userId = sub.metadata?.user_id || sub.metadata?.userId || null;
        if (userId) {
          // Resolve business for this user (owned first, then membership)
          let businessId: string | undefined;
          try {
            const { data: owned } = await admin
              .from("businesses")
              .select("id")
              .eq("owner_user_id", userId)
              .order("created_at", { ascending: true })
              .limit(1)
              .maybeSingle();
            businessId = owned?.id as string | undefined;
            if (!businessId) {
              const { data: memberOf } = await admin
                .from("memberships")
                .select("business_id")
                .eq("user_id", userId)
                .order("created_at", { ascending: true })
                .limit(1)
                .maybeSingle();
              businessId = (memberOf?.business_id as string | undefined) || undefined;
            }
          } catch {}

          const price = sub.items?.data?.[0]?.price || null;
          const actualLookupKey = (price?.lookup_key as string | null) || null;

          // Get current period from subscription items (Stripe moved these fields to item level in March 2025)
          const firstItem = sub.items?.data?.[0];
          const itemCurrentPeriodStart = firstItem?.current_period_start;
          const itemCurrentPeriodEnd = firstItem?.current_period_end;

          const currentPeriodEndIso = itemCurrentPeriodEnd ? new Date(itemCurrentPeriodEnd * 1000).toISOString() : null;
          const currentPeriodStartIso = itemCurrentPeriodStart ? new Date(itemCurrentPeriodStart * 1000).toISOString() : null;
          const billingCycleAnchorIso = (sub as any).billing_cycle_anchor ? new Date((sub as any).billing_cycle_anchor * 1000).toISOString() : null;
          const trialEndIso = (sub as any).trial_end ? new Date((sub as any).trial_end * 1000).toISOString() : null;

          await admin
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                business_id: businessId || null,
                stripe_customer_id: sub.customer as string | null,
                stripe_subscription_id: sub.id as string,
                plan_id: actualLookupKey?.replace(/_monthly_eur$/, "").replace(/^waitq_/, "") || null,
                price_lookup_key: actualLookupKey,
                price_id: (price?.id as string | undefined) || null,
                latest_invoice_id: (sub.latest_invoice as string | undefined) || null,
                discount_json: (sub.discount as any) || null,
                collection_method: (sub.collection_method as string | undefined) || null,
                billing_cycle_anchor: billingCycleAnchorIso,
                cancel_at_period_end: typeof sub.cancel_at_period_end === "boolean" ? sub.cancel_at_period_end : null,
                status: sub.status as string,
                current_period_start: currentPeriodStartIso,
                current_period_end: currentPeriodEndIso,
                trial_end: trialEndIso,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
        }
      } catch {}
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}


