import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createRouteClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    const stripe = getStripe();
    const supabase = await createRouteClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data: subscription } = await supabase
            .from("subscriptions")
            .select("stripe_customer_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (!subscription?.stripe_customer_id) {
            return NextResponse.json({ error: "No subscription found" }, { status: 400 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscriptions`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Error creating portal session:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
