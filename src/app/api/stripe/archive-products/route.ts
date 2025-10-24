import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createRouteClient } from "@/lib/supabase/server";
import { plans } from "@/lib/plans";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = (process.env.ADMIN_EMAIL || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (allowed.length && !allowed.includes(user.email || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stripe = getStripe();

  // Product IDs to keep active (Base, Premium)
  const keepProductIds = new Set<string>(
    Object.values(plans)
      .map((p) => p.stripe.productId)
      .filter((id): id is string => !!id)
  );

  const archived: { productId: string; name: string; pricesArchived: number }[] = [];
  const kept: { productId: string; name: string }[] = [];

  // Iterate through all active products (may need to paginate if >100)
  let startingAfter: string | undefined = undefined;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const list: Awaited<ReturnType<typeof stripe.products.list>> = await stripe.products.list({ active: true, limit: 100, starting_after: startingAfter });
    for (const product of list.data) {
      if (keepProductIds.has(product.id)) {
        kept.push({ productId: product.id, name: product.name });
        continue;
      }
      // Archive product
      try {
        // Also archive product's active prices
        let pricesArchived = 0;
        const priceList = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
        for (const pr of priceList.data) {
          try {
            await stripe.prices.update(pr.id, { active: false });
            pricesArchived += 1;
          } catch {}
        }
        await stripe.products.update(product.id, { active: false });
        archived.push({ productId: product.id, name: product.name, pricesArchived });
      } catch {}
    }
    if (!list.has_more) break;
    startingAfter = list.data[list.data.length - 1]?.id;
  }

  return NextResponse.json({ ok: true, archived, kept });
}


