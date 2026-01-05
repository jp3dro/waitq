import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { createRouteClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit({ key: `w-status:${ip}`, limit: 120, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  // Use the public-safe RPC (does not expose phone numbers).
  const supabase = await createRouteClient();
  const { data, error: e1 } = await supabase.rpc("public_waitlist_entry_by_token", { p_token: token });
  if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });
  const entry = Array.isArray(data) ? data[0] : data;
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = getAdminClient();

  let nowServing: number | null = null;
  let business: { name: string | null; logo_url: string | null; accent_color?: string | null; background_color?: string | null } | null = null;
  let displayToken: string | null = null;
  let waitlistName: string | null = null;
  if (entry?.waitlist_id) {
    const { data } = await admin
      .from("waitlist_entries")
      .select("ticket_number, notified_at, status")
      .eq("waitlist_id", entry.waitlist_id)
      .in("status", ["notified", "seated"])
      .order("notified_at", { ascending: false, nullsFirst: false })
      .order("ticket_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    nowServing = data?.ticket_number ?? null;

    // Fetch the public display token for this waitlist to support redirects
    const { data: wl } = await admin
      .from("waitlists")
      .select("display_token, name")
      .eq("id", entry.waitlist_id)
      .maybeSingle();
    displayToken = (wl?.display_token as string | null) || null;
    waitlistName = (wl?.name as string | null) || null;
  }

  if (entry?.business_id) {
    const { data: biz } = await admin
      .from("businesses")
      .select("name, logo_url, accent_color, background_color")
      .eq("id", entry.business_id)
      .limit(1)
      .maybeSingle();
    if (biz) business = {
      name: (biz as { name: string | null }).name ?? null,
      logo_url: (biz as { logo_url: string | null }).logo_url ?? null,
      accent_color: (biz as { accent_color: string | null }).accent_color ?? null,
      background_color: (biz as { background_color: string | null }).background_color ?? null,
    };
  }

  return NextResponse.json({ entry, nowServing, business, displayToken, waitlistName });
}


