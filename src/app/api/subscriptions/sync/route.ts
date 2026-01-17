import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { syncSubscriptionForUser } from "@/lib/subscription-sync";

export async function POST() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await syncSubscriptionForUser({ userId: user.id, email: user.email });
  return NextResponse.json({ ok: true, planId: result.planId });
}

