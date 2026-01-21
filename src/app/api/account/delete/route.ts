import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminClient();

  // Businesses owned by this user (created during onboarding)
  const { data: ownedBusinesses, error: ownedErr } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id);
  if (ownedErr) return NextResponse.json({ error: ownedErr.message }, { status: 500 });

  const ownedBusinessIds = (ownedBusinesses ?? [])
    .map((b) => (b as unknown as { id?: string }).id)
    .filter((v): v is string => typeof v === "string");

  // Best-effort: cancel Stripe subscription(s) and delete customer record.
  // We try by reading the subscriptions table first; if Stripe isn't configured, we continue deleting DB rows anyway.
  try {
    const stripe = getStripe();
    const { data: subsRows } = await admin
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id")
      .or(`user_id.eq.${user.id}${ownedBusinessIds.length ? `,business_id.in.(${ownedBusinessIds.join(",")})` : ""}`)
      .limit(50);
    const rows = (subsRows || []) as { stripe_customer_id?: string | null; stripe_subscription_id?: string | null }[];
    const subIds = Array.from(
      new Set(rows.map((r) => r.stripe_subscription_id).filter((v): v is string => typeof v === "string" && v.length > 0))
    );
    const custIds = Array.from(
      new Set(rows.map((r) => r.stripe_customer_id).filter((v): v is string => typeof v === "string" && v.length > 0))
    );
    for (const subId of subIds) {
      try {
        await stripe.subscriptions.cancel(subId, { prorate: false });
      } catch { }
    }
    for (const custId of custIds) {
      try {
        await stripe.customers.del(custId);
      } catch { }
    }
  } catch {
    // Stripe not configured or not reachable; ignore.
  }

  // Account deletion semantics:
  // - If the user owns businesses, delete those businesses entirely (cascades waitlists, locations, entries, memberships).
  // - If the user is merely a member of other businesses, remove their memberships only (do not delete shared business data).
  if (ownedBusinessIds.length > 0) {
    // Do not rely on DB cascades: explicitly delete known dependent rows first.
    // Waitlists for owned businesses
    const { data: ownedWaitlists } = await admin
      .from("waitlists")
      .select("id")
      .in("business_id", ownedBusinessIds);
    const ownedWaitlistIds = (ownedWaitlists ?? [])
      .map((w) => (w as unknown as { id?: string }).id)
      .filter((v): v is string => typeof v === "string");

    if (ownedWaitlistIds.length > 0) {
      await admin.from("waitlist_entries").delete().in("waitlist_id", ownedWaitlistIds);
      await admin.from("waitlists").delete().in("id", ownedWaitlistIds);
    }

    await admin.from("business_locations").delete().in("business_id", ownedBusinessIds);
    await admin.from("memberships").delete().in("business_id", ownedBusinessIds);
    await admin.from("subscriptions").delete().in("business_id", ownedBusinessIds);
    const { error: bizDelErr } = await admin.from("businesses").delete().in("id", ownedBusinessIds);
    if (bizDelErr) return NextResponse.json({ error: bizDelErr.message }, { status: 500 });
  }

  // Always remove the user's memberships (member of other businesses)
  const { error: selfMembershipsErr } = await admin.from("memberships").delete().eq("user_id", user.id);
  if (selfMembershipsErr) return NextResponse.json({ error: selfMembershipsErr.message }, { status: 500 });

  // Delete per-user subscription row (if any)
  await admin.from("subscriptions").delete().eq("user_id", user.id);

  // Profile row
  const { error: profileErr } = await admin.from("profiles").delete().eq("id", user.id);
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

  // Finally, delete the auth user.
  try {
    const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to delete auth user" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

