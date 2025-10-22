import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

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

  const { data: members } = await supabase
    .from("memberships")
    .select("id, user_id, role")
    .eq("business_id", bizId)
    .order("created_at", { ascending: true });

  const { data: biz } = await supabase
    .from("businesses")
    .select("owner_user_id")
    .eq("id", bizId)
    .maybeSingle();
  const ownerUserId = (biz?.owner_user_id as string | undefined) || null;
  return NextResponse.json({ members: members || [], ownerUserId });
}


