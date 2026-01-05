import { createClient } from "@/lib/supabase/server";
import PrivateSidebarClient from "@/components/private-sidebar-client";

export default async function PrivateSidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Resolve role via memberships (fallback to email admin for legacy)
  const { data: biz } = await supabase
    .from("businesses")
    .select("id")
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

  return <PrivateSidebarClient userEmail={user?.email ?? null} role={role} lists={lists || []} />;
}


