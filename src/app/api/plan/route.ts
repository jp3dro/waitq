import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { countSmsInPeriod, getPlanContext } from "@/lib/plan-limits";
import { resolveCurrentBusinessId } from "@/lib/current-business";

export async function GET() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await resolveCurrentBusinessId(supabase as any, user.id);

  if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const ctx = await getPlanContext(businessId);
  const usedSms = await countSmsInPeriod(businessId, ctx.window.start, ctx.window.end);
  return NextResponse.json({
    planId: ctx.planId,
    limits: ctx.limits,
    usage: {
      sms: {
        used: usedSms,
        limit: ctx.limits.messagesPerMonth,
      },
      window: {
        start: ctx.window.start.toISOString(),
        end: ctx.window.end.toISOString(),
      },
    },
  });
}

