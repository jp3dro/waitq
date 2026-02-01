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

  // Token hardening: refuse obviously-invalid tokens to reduce abuse / scanning.
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  // Per-token rate limit (in addition to per-IP) to minimize brute force / overuse.
  const rlToken = checkRateLimit({ key: `w-status:t:${token}`, limit: 120, windowMs: 60_000 });
  if (!rlToken.ok) {
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(rlToken.retryAfterSec) } }
    );
  }

  // Use the public-safe RPC (does not expose phone numbers).
  const supabase = await createRouteClient();
  const { data, error: e1 } = await supabase.rpc("public_waitlist_entry_by_token", { p_token: token });
  if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });
  const entry = Array.isArray(data) ? data[0] : data;
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Invalidate/expire sessions after 24 hours to reduce token reuse and unnecessary load.
  try {
    const createdAt = entry?.created_at ? new Date(entry.created_at as string) : null;
    const ageMs = createdAt ? Date.now() - createdAt.getTime() : 0;
    if (createdAt && isFinite(ageMs) && ageMs > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "Expired" }, { status: 410 });
    }
  } catch { }

  const admin = getAdminClient();

  let nowServing: number | null = null;
  let aheadCount: number | null = null;
  let business:
    | {
      name: string | null;
      logo_url: string | null;
      accent_color?: string | null;
      background_color?: string | null;
      website_url?: string | null;
      instagram_url?: string | null;
      facebook_url?: string | null;
      google_maps_url?: string | null;
      menu_url?: string | null;
    }
    | null = null;
  let displayToken: string | null = null;
  let waitlistName: string | null = null;
  let locationPhone: string | null = null;
  let locationAddress: string | null = null;
  let locationCity: string | null = null;
  let locationName: string | null = null;
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

    // Count how many waiting entries are ahead of this ticket.
    if (entry?.ticket_number) {
      const { count } = await admin
        .from("waitlist_entries")
        .select("id", { count: "exact", head: true })
        .eq("waitlist_id", entry.waitlist_id)
        .eq("status", "waiting")
        .lt("ticket_number", entry.ticket_number);
      aheadCount = typeof count === "number" ? count : null;
    } else if (typeof entry?.queue_position === "number") {
      aheadCount = Math.max(0, entry.queue_position - 1);
    }

    // Fetch the public display token for this waitlist to support redirects
    const { data: wl } = await admin
      .from("waitlists")
      .select("display_token, name, location_id")
      .eq("id", entry.waitlist_id)
      .maybeSingle();
    displayToken = (wl?.display_token as string | null) || null;
    waitlistName = (wl?.name as string | null) || null;

    const locationId = (wl?.location_id as string | null) || null;
    if (locationId) {
      const { data: loc } = await admin
        .from("business_locations")
        .select("name, phone, address, city")
        .eq("id", locationId)
        .maybeSingle();
      const p = (loc?.phone as string | null) || null;
      locationName = (loc?.name as string | null) || null;
      locationPhone = p && p.trim().length ? p.trim() : null;
      locationAddress = (loc?.address as string | null) || null;
      locationCity = (loc?.city as string | null) || null;
    }
  }

  if (entry?.business_id) {
    const { data: biz } = await admin
      .from("businesses")
      .select("name, logo_url, accent_color, background_color, website_url, instagram_url, facebook_url, google_maps_url, menu_url")
      .eq("id", entry.business_id)
      .limit(1)
      .maybeSingle();
    if (biz) business = {
      name: (biz as { name: string | null }).name ?? null,
      logo_url: (biz as { logo_url: string | null }).logo_url ?? null,
      accent_color: (biz as { accent_color: string | null }).accent_color ?? null,
      background_color: (biz as { background_color: string | null }).background_color ?? null,
      website_url: (biz as { website_url: string | null }).website_url ?? null,
      instagram_url: (biz as { instagram_url: string | null }).instagram_url ?? null,
      facebook_url: (biz as { facebook_url: string | null }).facebook_url ?? null,
      google_maps_url: (biz as { google_maps_url: string | null }).google_maps_url ?? null,
      menu_url: (biz as { menu_url: string | null }).menu_url ?? null,
    };
  }

  // Fetch customer name from the entry (if available) for personalization
  let customerName: string | null = null;
  // Prefer whatever the RPC returned, but fall back to an admin lookup by token (RPCs may not include `id`).
  customerName = (entry?.customer_name as string | null) || null;
  if (!customerName) {
    const { data: entryWithName } = await admin
      .from("waitlist_entries")
      .select("customer_name")
      .eq("token", token)
      .maybeSingle();
    customerName = (entryWithName?.customer_name as string | null) || null;
  }

  return NextResponse.json({ entry, nowServing, aheadCount, business, displayToken, waitlistName, locationPhone, locationAddress, locationCity, locationName, customerName });
}


