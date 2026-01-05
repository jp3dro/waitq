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
            .insert({ business_id: biz.id as string, user_id: user.id, role: 'admin', status: 'active' })
            .select("id")
            .maybeSingle();
        }
      }

      // Accept pending invites
      if (user.email) {
        const { data: pendingInvites } = await admin
          .from("memberships")
          .select("id")
          .eq("invitation_email", user.email)
          .eq("status", "pending");

        if (pendingInvites && pendingInvites.length > 0) {
          for (const inv of pendingInvites) {
            await admin
              .from("memberships")
              .update({ user_id: user.id, status: 'active', invitation_email: null })
              .eq("id", inv.id);
          }
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
        } catch { }

        if (businessId) {
          // Ensure at least one location exists
          const { data: locs } = await admin
            .from("business_locations")
            .select("id")
            .eq("business_id", businessId)
            .limit(1);

          let locationId = locs?.[0]?.id;

          if (!locationId) {
            const { data: newLoc } = await admin
              .from("business_locations")
              .insert({ business_id: businessId, name: "Main Location" })
              .select("id")
              .single();
            locationId = newLoc?.id;
          }

          // Ensure at least one waitlist exists
          if (locationId) {
            const { count } = await admin
              .from("waitlists")
              .select("*", { count: "exact", head: true })
              .eq("business_id", businessId);

            if ((count || 0) === 0) {
              await admin.from("waitlists").insert({
                business_id: businessId,
                location_id: locationId,
                name: "Main List",
                list_type: "restaurants",
                kiosk_enabled: false
              });
            }
          }
        }

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
      } catch { }
    }
  }
  const redirectUrl = new URL("/dashboard", process.env.NEXT_PUBLIC_SITE_URL || req.url);
  return NextResponse.redirect(redirectUrl);
}


