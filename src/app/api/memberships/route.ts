import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

function validateRole(role: unknown): role is 'manager' | 'staff' | 'admin' {
  return role === 'manager' || role === 'staff' || role === 'admin';
}

async function resolveBusinessId(userId: string) {
  const supabase = await createRouteClient();
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("active_business_id")?.value || null;
  if (fromCookie) return fromCookie;
  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (owned?.id) return owned.id as string;
  const { data: memberOf } = await supabase
    .from("memberships")
    .select("business_id")
    .eq("user_id", userId)
    .maybeSingle();
  return (memberOf?.business_id as string | undefined) || null;
}

export async function POST(req: NextRequest) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, role } = await req.json().catch(() => ({}));
  if (!email || typeof email !== 'string') return NextResponse.json({ error: "Missing email" }, { status: 400 });
  const invRole = validateRole(role) ? role : 'staff';

  const businessId = await resolveBusinessId(user.id);
  if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 400 });

  // Only admins or owners can invite
  const { data: biz } = await supabase.from("businesses").select("owner_user_id").eq("id", businessId).maybeSingle();
  const isOwner = (biz?.owner_user_id as string | undefined) === user.id;
  const { data: me } = await supabase.from("memberships").select("role").eq("business_id", businessId).eq("user_id", user.id).maybeSingle();
  if (!(isOwner || me?.role === 'admin')) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Insert membership using admin client
  const admin = getAdminClient();
  const userId = email; // TODO: map to auth user id
  const { error: insErr } = await admin
    .from("memberships")
    .insert({ business_id: businessId, user_id: userId, role: invRole })
    .select("id")
    .maybeSingle();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { membershipId } = await req.json().catch(() => ({}));
  if (!membershipId || typeof membershipId !== 'string') return NextResponse.json({ error: "Missing membershipId" }, { status: 400 });

  const businessId = await resolveBusinessId(user.id);
  if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 400 });

  // Safety checks: cannot remove owner/admin membership
  const admin = getAdminClient();
  const { data: m } = await admin
    .from("memberships")
    .select("id, user_id, role")
    .eq("id", membershipId)
    .eq("business_id", businessId)
    .maybeSingle();
  const { data: biz } = await admin.from("businesses").select("owner_user_id").eq("id", businessId).maybeSingle();
  if (!m || !biz) return NextResponse.json({ error: "Invalid membership" }, { status: 400 });
  const isOwnerMembership = (m.user_id as string) === (biz.owner_user_id as string);
  if (isOwnerMembership || m.role === 'admin') return NextResponse.json({ error: "Cannot remove admin user" }, { status: 400 });

  const { error: delErr } = await admin.from("memberships").delete().eq("id", membershipId).eq("business_id", businessId);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}


