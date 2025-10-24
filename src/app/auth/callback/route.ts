import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createRouteClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Ensure a business exists for this user; if not, create one
      const admin = getAdminClient();
      const stripe = getStripe();
      const { data: existing } = await admin
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (!existing) {
        const defaultName = (user.email || "My Business").split("@")[0];
        await admin
          .from("businesses")
          .insert({ owner_user_id: user.id, name: defaultName, accent_color: "#FFFFFF", background_color: "#000000" });

        // Ensure owner is admin member
        const { data: biz } = await admin
          .from("businesses")
          .select("id")
          .eq("owner_user_id", user.id)
          .maybeSingle();
        if (biz?.id) {
          await admin
            .from("memberships")
            .insert({ business_id: biz.id as string, user_id: user.id, role: 'admin' })
            .select("id")
            .maybeSingle();
        }
      }

      // Ensure Stripe customer exists and link to subscriptions row
      try {
        let stripeCustomerId: string | null = null;
        // Attempt to find by email
        if (user.email) {
          const list = await stripe.customers.list({ email: user.email, limit: 1 });
          stripeCustomerId = list.data?.[0]?.id || null;
        }
        // Create if missing
        if (!stripeCustomerId) {
          const created = await stripe.customers.create({
            email: user.email || undefined,
            metadata: { user_id: user.id },
          });
          stripeCustomerId = created.id;
        }

        // Resolve business for this user to link
        let businessId: string | null = null;
        try {
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
        } catch {}

        // Upsert minimal subscriptions linkage row
        await admin
          .from("subscriptions")
          .upsert(
            {
              user_id: user.id,
              business_id: businessId,
              stripe_customer_id: stripeCustomerId,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
      } catch {}
    }
  }
  const redirectUrl = new URL("/dashboard", process.env.NEXT_PUBLIC_SITE_URL || req.url);
  return NextResponse.redirect(redirectUrl);
}


