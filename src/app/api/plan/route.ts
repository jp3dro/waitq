import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getPlanContext } from "@/lib/plan-limits";

export async function GET() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Prefer owned business; else first membership business.
  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let businessId = (owned?.id as string | undefined) || null;
  if (!businessId) {
    const { data: member } = await supabase
      .from("memberships")
      .select("business_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    businessId = (member?.business_id as string | undefined) || null;
  }

  if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const ctx = await getPlanContext(businessId);
  return NextResponse.json({ planId: ctx.planId, limits: ctx.limits });
}

