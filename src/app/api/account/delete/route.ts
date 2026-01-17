import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

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

  // Businesses the user is a member of (invites)
  const { data: memberRows, error: memberErr } = await admin
    .from("memberships")
    .select("business_id")
    .eq("user_id", user.id);
  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 });

  const memberBusinessIds = (memberRows ?? [])
    .map((r) => (r as unknown as { business_id?: string }).business_id)
    .filter((v): v is string => typeof v === "string");

  // Account deletion semantics:
  // - If the user owns businesses, delete those businesses entirely (cascades waitlists, locations, entries, memberships).
  // - If the user is merely a member of other businesses, remove their memberships only (do not delete shared business data).
  if (ownedBusinessIds.length > 0) {
    const { error: bizDelErr } = await admin.from("businesses").delete().in("id", ownedBusinessIds);
    if (bizDelErr) return NextResponse.json({ error: bizDelErr.message }, { status: 500 });
  }

  if (memberBusinessIds.length > 0) {
    const { error: selfMembershipsErr } = await admin.from("memberships").delete().eq("user_id", user.id);
    if (selfMembershipsErr) return NextResponse.json({ error: selfMembershipsErr.message }, { status: 500 });
  }

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

