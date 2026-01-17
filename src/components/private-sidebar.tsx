import { createClient } from "@/lib/supabase/server";
import PrivateSidebarClient from "@/components/private-sidebar-client";
import { getPlanContext } from "@/lib/plan-limits";

export default async function PrivateSidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Resolve role via memberships (fallback to email admin for legacy)
  const { data: ownedBiz } = user?.id
    ? await supabase
      .from("businesses")
      .select("id, logo_url, owner_user_id")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    : { data: null };

  // Fallback to first membership business (for users invited to an existing business)
  const { data: membershipBizIdRow } = !ownedBiz?.id && user?.id
    ? await supabase
      .from("memberships")
      .select("business_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    : { data: null };

  const businessIdForSidebar =
    (ownedBiz?.id as string | undefined) ||
    (membershipBizIdRow?.business_id as string | undefined) ||
    undefined;

  const { data: biz } = businessIdForSidebar
    ? await supabase
      .from("businesses")
      .select("id, logo_url, owner_user_id")
      .eq("id", businessIdForSidebar)
      .maybeSingle()
    : { data: null };

  const { data: me } = biz?.id
    ? await supabase.from("memberships").select("role").eq("business_id", biz.id).eq("user_id", user?.id || "").maybeSingle()
    : { data: null as any };

  const isOwner = !!user?.id && (biz?.owner_user_id as string | null) === user.id;
  const role =
    (me?.role as string | undefined) ||
    (isOwner ? "admin" : undefined) ||
    (user?.email === "jp3dro@gmail.com" ? "admin" : undefined);

  const businessLogoUrl = (biz?.logo_url as string | null) || null;
  const planId = biz?.id ? (await getPlanContext(biz.id)).planId : "free";

  // Fetch waitlists for the sidebar
  const { data: lists } = biz?.id
    ? await supabase
      .from("waitlists")
      .select("id, name")
      .eq("business_id", biz.id)
      .order("created_at", { ascending: true })
    : { data: [] };

  // Get user's name from onboarding (stored in user_metadata.full_name)
  const userName = user?.user_metadata?.full_name || null;

  return (
    <PrivateSidebarClient
      userName={userName}
      userEmail={user?.email ?? null}
      businessLogoUrl={businessLogoUrl}
      role={role}
      lists={lists || []}
      planId={planId}
    />
  );
}

/*
  Previous implementation selected the earliest `businesses` row without scoping to the current user,
  which could result in incorrect role resolution and hidden settings links for new accounts.
*/

/*
export default async function PrivateSidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Resolve role via memberships (fallback to email admin for legacy)
  const { data: biz } = await supabase
    .from("businesses")
    .select("id, logo_url")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const { data: me } = biz?.id
    ? await supabase.from("memberships").select("role").eq("business_id", biz.id).eq("user_id", user?.id || "").maybeSingle()
    : { data: null as any };
  const role = (me?.role as string | undefined) || (user?.email === "jp3dro@gmail.com" ? "admin" : undefined);

  // Fetch waitlists for the sidebar
  const { data: lists } = biz?.id
    ? await supabase
      .from("waitlists")
      .select("id, name")
      .eq("business_id", biz.id)
      .order("created_at", { ascending: true })
    : { data: [] };

  // Get user's name from onboarding (stored in user_metadata.full_name)
  const userName = user?.user_metadata?.full_name || null;
  const businessLogoUrl = (biz?.logo_url as string | null) || null;
  const planId = biz?.id ? (await getPlanContext(biz.id)).planId : "free";

  return (
    <PrivateSidebarClient
      userName={userName}
      userEmail={user?.email ?? null}
      businessLogoUrl={businessLogoUrl}
      role={role}
      lists={lists || []}
      planId={planId}
    />
  );
}
*/


