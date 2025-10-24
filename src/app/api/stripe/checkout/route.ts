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
    } else {
      return NextResponse.json({ error: "No price found" }, { status: 400 });
    }
  }

  // If we already have a Stripe customer for this user, reuse it to avoid duplicates
  try {
    const { data: row } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    existingStripeCustomerId = (row?.stripe_customer_id as string | null) || null;
  } catch {}

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
  } catch {}

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: resolvedPriceId, quantity: 1 }],
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


