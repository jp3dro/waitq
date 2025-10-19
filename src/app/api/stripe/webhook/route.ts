import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminClient } from "@/lib/supabase/admin";

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
        const session = event.data.object as any;
        const subscriptionId = session.subscription as string | null;
        const customerId = session.customer as string | null;
        const metadata = session.subscription_details?.metadata || session.metadata || {};
        const userId = metadata.user_id || metadata.userId || null;
        const planId = metadata.plan_id || metadata.planId || null;
        const lookupKey = metadata.lookup_key || metadata.lookupKey || null;
        if (userId && subscriptionId) {
          const admin = getAdminClient();
          await admin
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                plan_id: planId,
                price_lookup_key: lookupKey,
                status: "active",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
        }
      } catch (e) {}
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      try {
        const sub = event.data.object as any;
        const admin = getAdminClient();
        // We expect user id in subscription.metadata
        const userId = sub.metadata?.user_id || sub.metadata?.userId || null;
        if (userId) {
          await admin
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                stripe_customer_id: sub.customer as string | null,
                stripe_subscription_id: sub.id as string,
                plan_id: sub.items?.data?.[0]?.price?.lookup_key?.replace(/_monthly_eur$/, "").replace(/^waitq_/, "") || null,
                price_lookup_key: sub.items?.data?.[0]?.price?.lookup_key || null,
                status: sub.status as string,
                current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
        }
      } catch (e) {}
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


