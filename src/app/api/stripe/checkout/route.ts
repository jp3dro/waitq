import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createRouteClient } from "@/lib/supabase/server";
import { plans } from "@/lib/plans";

export async function POST(req: NextRequest) {
  const { priceId, lookupKey, customerEmail, planId } = await req.json();
  const stripe = getStripe();

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let resolvedPriceId = priceId as string | undefined;

  // Resolve via lookup key if provided
  if (!resolvedPriceId && lookupKey) {
    // Try search API first
    try {
      // @ts-expect-error search may not be in types depending on stripe lib version
      const search = await (stripe.prices as any).search?.({
        query: `active:'true' AND lookup_key:'${lookupKey}'`,
        limit: 1,
      });
      if (search && search.data && search.data.length > 0) {
        resolvedPriceId = search.data[0].id as string;
      }
    } catch (_) {
      // Fallback to list; some accounts may not have search enabled
      const list = await stripe.prices.list({ active: true, limit: 50 });
      const found = list.data.find((p: any) => p.lookup_key === lookupKey);
      if (found) resolvedPriceId = found.id;
    }
  }

  // Fallback by planId + amount if lookupKey not found
  if (!resolvedPriceId && planId && plans[planId as keyof typeof plans]) {
    const p = plans[planId as keyof typeof plans];
    const targetAmount = Math.round(p.priceMonthlyEUR * 100);
    const list = await stripe.prices.list({ active: true, limit: 100, currency: "eur" });
    const found = list.data.find((pr: any) => pr.recurring && pr.recurring.interval === "month" && pr.unit_amount === targetAmount);
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

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: resolvedPriceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
    customer_email: customerEmail || user.email || undefined,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan_id: planId || "",
        lookup_key: lookupKey || "",
      },
    },
  });
  return NextResponse.json({ url: session.url });
}


