import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createRouteClient } from "@/lib/supabase/server";
import { plans } from "@/lib/plans";
import type { Stripe } from "stripe";

export async function POST(req: NextRequest) {
  const { priceId, lookupKey, customerEmail, planId } = await req.json();
  const stripe = getStripe();

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let resolvedPriceId = priceId as string | undefined;
  let existingStripeCustomerId: string | null = null;
  let businessId: string | null = null;

  // Resolve via lookup key if provided
  if (!resolvedPriceId && lookupKey) {
    // Try search API first
    try {
      const search = await (stripe.prices as unknown as { search: (params: { query: string; limit: number }) => Promise<{ data: Stripe.Price[] }> }).search?.({
        query: `active:'true' AND lookup_key:'${lookupKey}'`,
        limit: 1,
      });
      if (search && search.data && search.data.length > 0) {
        resolvedPriceId = search.data[0].id;
      }
    } catch {
      // Fallback to list; some accounts may not have search enabled
      const list = await stripe.prices.list({ active: true, limit: 50 });
      const found = list.data.find((p: Stripe.Price) => p.lookup_key === lookupKey);
      if (found) resolvedPriceId = found.id;
    }
  }

  // Fallback by planId + amount if lookupKey not found
  if (!resolvedPriceId && planId && plans[planId as keyof typeof plans]) {
    const p = plans[planId as keyof typeof plans];
    const targetAmount = Math.round(p.priceMonthlyEUR * 100);
    const list = await stripe.prices.list({ active: true, limit: 100, currency: "eur" });
    const found = list.data.find((pr: Stripe.Price) => pr.recurring && pr.recurring.interval === "month" && pr.unit_amount === targetAmount);
    if (found) resolvedPriceId = found.id;
  }

  if (!resolvedPriceId) {
    const envDefault = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    if (envDefault) {
      resolvedPriceId = envDefault;
    }
    // Do not return error here; we will fallback to inline price_data using productId below
  }

  // If we already have a Stripe customer for this user, check for active subscription to upgrade/update
  let activeSubscriptionId: string | null = null;

  try {
    const { data: row } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    existingStripeCustomerId = (row?.stripe_customer_id as string | null) || null;

    // Check if subscription is active
    const status = row?.status;
    if (row?.stripe_subscription_id && (status === 'active' || status === 'trialing' || status === 'past_due')) {
      activeSubscriptionId = row.stripe_subscription_id;
    }
  } catch { }

  // If there is an active subscription, redirect to Portal Update flow instead of creating a new Checkout Session (which would double-subscribe)
  if (activeSubscriptionId && existingStripeCustomerId) {
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: existingStripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscriptions`,
        flow_data: {
          type: 'subscription_update',
          subscription_update: {
            subscription: activeSubscriptionId,
          },
        },
      });
      return NextResponse.json({ url: portalSession.url });
    } catch (err: any) {
      console.error("Error creating portal session for update:", err);

      // Special case: If the subscription is missing in Stripe (deleted manually or environment mismatch),
      // we should NOT try to open the portal, but rather proceed to create a NEW checkout session.
      // This fixes the dead-loop where a stale DB record prevents new subscriptions.
      if (err.code === 'resource_missing' || (err.message && err.message.includes('No such subscription'))) {
        console.warn("Stale subscription detected in DB. Proceeding to new checkout.");
        // Fall through to checkout session creation below
      } else {
        // Fallback: If deep link to update flow fails (common if config is disabled), 
        // try opening the general portal instead.
        try {
          const portalSession = await stripe.billingPortal.sessions.create({
            customer: existingStripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscriptions`,
          });
          return NextResponse.json({ url: portalSession.url });
        } catch (fallbackErr) {
          console.error("Error creating fallback portal session:", fallbackErr);
          return NextResponse.json({ error: "Unable to initiate plan update. Please check your Customer Portal settings in the Stripe Dashboard." }, { status: 400 });
        }
      }
    }
  }

  // Resolve business_id for this user: owned first, then membership
  try {
    const { data: owned } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    businessId = (owned?.id as string | undefined) || null;
    if (!businessId) {
      const { data: memberOf } = await supabase
        .from("memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      businessId = (memberOf?.business_id as string | undefined) || null;
    }
  } catch { }

  // Build line item: prefer existing recurring price; otherwise use inline price_data with monthly recurring
  let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;
  if (resolvedPriceId) {
    lineItem = { price: resolvedPriceId, quantity: 1 };
  } else if (planId && plans[planId as keyof typeof plans]?.stripe?.productId) {
    const p = plans[planId as keyof typeof plans];
    lineItem = {
      quantity: 1,
      price_data: {
        currency: "eur",
        product: p.stripe.productId as string,
        unit_amount: Math.round(p.priceMonthlyEUR * 100),
        recurring: { interval: "month" },
      },
    } as Stripe.Checkout.SessionCreateParams.LineItem;
  } else {
    return NextResponse.json({ error: "Unable to resolve price" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [lineItem],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscriptions?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscriptions`,
    customer: existingStripeCustomerId || undefined,
    customer_email: existingStripeCustomerId ? undefined : (customerEmail || user.email || undefined),
    allow_promotion_codes: true,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      plan_id: planId || "",
      lookup_key: lookupKey || "",
      business_id: businessId || "",
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan_id: planId || "",
        lookup_key: lookupKey || "",
        business_id: businessId || "",
      },
    },
  });
  return NextResponse.json({ url: session.url });
}


