import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createRouteClient } from "@/lib/supabase/server";
import { orderedPlans } from "@/lib/plans";

export async function POST(_req: NextRequest) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Basic protection: restrict to admin email env or same domain
  const allowed = (process.env.ADMIN_EMAIL || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (allowed.length && !allowed.includes(user.email || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stripe = getStripe();
  const results: any[] = [];

  for (const plan of orderedPlans) {
    // Skip free plan for Stripe product/price creation
    if (plan.priceMonthlyEUR === 0) {
      results.push({ plan: plan.id, skipped: true });
      continue;
    }

    // 1) Find or create product
    let productId: string | null = null;
    try {
      // Try search first
      // @ts-expect-error search may not be typed depending on stripe lib version
      const found = await (stripe.products as any).search?.({ query: `active:'true' AND name:'${plan.name}'`, limit: 1 });
      if (found && found.data && found.data.length > 0) productId = found.data[0].id as string;
    } catch {}
    if (!productId) {
      const list = await stripe.products.list({ active: true, limit: 100 });
      const byName = list.data.find((p) => p.name === plan.name);
      if (byName) productId = byName.id;
    }
    if (!productId) {
      const created = await stripe.products.create({ name: plan.name, active: true, description: `${plan.name} monthly subscription` });
      productId = created.id;
    }

    // 2) Find or create monthly recurring price with lookup_key
    const lookupKey = plan.stripe.priceLookupKeyMonthly;
    let priceId: string | null = null;
    try {
      // @ts-expect-error search may not be typed depending on stripe lib version
      const found = await (stripe.prices as any).search?.({ query: `active:'true' AND lookup_key:'${lookupKey}'`, limit: 1 });
      if (found && found.data && found.data.length > 0) priceId = found.data[0].id as string;
    } catch {}
    if (!priceId) {
      const list = await stripe.prices.list({ product: productId, active: true, limit: 100 });
      const monthly = list.data.find((pr) => pr.lookup_key === lookupKey || (pr.recurring && pr.recurring.interval === "month" && pr.unit_amount === Math.round(plan.priceMonthlyEUR * 100)));
      if (monthly) priceId = monthly.id;
    }
    if (!priceId) {
      const created = await stripe.prices.create({
        product: productId,
        currency: "eur",
        unit_amount: Math.round(plan.priceMonthlyEUR * 100),
        recurring: { interval: "month" },
        lookup_key: lookupKey,
      } as any);
      priceId = created.id;
    }

    results.push({ plan: plan.id, productId, priceId });
  }

  return NextResponse.json({ ok: true, results });
}


