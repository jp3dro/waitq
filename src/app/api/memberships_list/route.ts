import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let bizId: string | null = null;
  const { data: owned } = await supabase.from("businesses").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (owned?.id) bizId = owned.id as string;
  if (!bizId) {
    const { data: memberOf } = await supabase.from("memberships").select("business_id").eq("user_id", user.id).maybeSingle();
    bizId = (memberOf?.business_id as string | undefined) || null;
  }
  if (!bizId) return NextResponse.json({ members: [], ownerUserId: null }, { status: 200 });

  const { data: biz } = await supabase
    .from("businesses")
    .select("owner_user_id")
    .eq("id", bizId)
    .maybeSingle();
  const ownerUserId = (biz?.owner_user_id as string | undefined) || null;

  const { data: me } = await supabase
    .from("memberships")
    .select("role")
    .eq("business_id", bizId)
    .eq("user_id", user.id)
    .maybeSingle();
  const isOwner = ownerUserId === user.id;
  const isAdmin = isOwner || me?.role === "admin";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = getAdminClient();
  const { data: members, error: memberErr } = await admin
    .from("memberships")
    .select("id, user_id, role, status, invitation_email, invitation_name, created_at")
    .eq("business_id", bizId)
    .order("created_at", { ascending: true });

  if (memberErr) {
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  // Resolve user details
  const resolvedMembers = await Promise.all((members || []).map(async (m) => {
    let email = m.invitation_email;
    let name = m.invitation_name || null;
    let status = m.status;

    if (status === 'pending' && m.created_at) {
      const created = new Date(m.created_at).getTime();
      const now = Date.now();
      if ((now - created) > 48 * 60 * 60 * 1000) {
        status = 'expired';
      }
    }

    if (!email && m.user_id) {
      const { data: u } = await admin.auth.admin.getUserById(m.user_id);
      email = u.user?.email || "Unknown";
      name = u.user?.user_metadata?.full_name || u.user?.user_metadata?.name || null;
    }

    return {
      ...m,
      status,
      email: email || m.user_id,
      name,
    };
  }));

  if (ownerUserId) {
    const ownerInList = resolvedMembers.find((m) => m.user_id === ownerUserId);
    if (!ownerInList) {
      const { data: u } = await admin.auth.admin.getUserById(ownerUserId);
      resolvedMembers.unshift({
        id: "owner-placeholder",
        user_id: ownerUserId,
        role: "admin",
        status: "active",
        invitation_email: null,
        email: u.user?.email || "Owner",
        name: u.user?.user_metadata?.full_name || u.user?.user_metadata?.name || "Owner",
      });
    }
  }

  return NextResponse.json({ members: resolvedMembers, ownerUserId });
}
