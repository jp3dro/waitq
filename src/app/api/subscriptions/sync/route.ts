import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { syncSubscriptionForUser } from "@/lib/subscription-sync";
import { syncPolarSubscriptionForUser } from "@/lib/polar-sync";

export async function POST() {
  const provider = process.env.NEXT_PUBLIC_BILLING_PROVIDER || "stripe";
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (provider === "polar") {
    const result = await syncPolarSubscriptionForUser({ userId: user.id });
    return NextResponse.json({ ok: true, provider, planId: result.planId, status: result.status });
  }

  const result = await syncSubscriptionForUser({ userId: user.id, email: user.email });
  return NextResponse.json({ ok: true, provider, planId: result.planId });
}

