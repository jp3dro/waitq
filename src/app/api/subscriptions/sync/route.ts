import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { syncPolarSubscriptionForUser } from "@/lib/polar-sync";

export async function POST() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await syncPolarSubscriptionForUser({ userId: user.id });
  return NextResponse.json({ ok: true, planId: result.planId, status: result.status });
}
