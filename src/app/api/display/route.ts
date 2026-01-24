import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getLocationOpenState, type RegularHours } from "@/lib/location-hours";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit({ key: `display:${ip}`, limit: 120, windowMs: 60_000 });
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
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  // Per-token rate limit (in addition to per-IP) to minimize brute force / overuse.
  const rlToken = checkRateLimit({ key: `display:t:${token}`, limit: 120, windowMs: 60_000 });
  if (!rlToken.ok) {
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(rlToken.retryAfterSec) } }
    );
  }

  const admin = getAdminClient();
  const listSelect = "id, name, kiosk_enabled, kiosk_qr_enabled, display_enabled, display_show_name, display_show_qr, business_id, location_id, seating_preferences, ask_name, ask_phone, ask_email, average_wait_minutes, business_locations:location_id(regular_hours, timezone)";
  let list = null as any;
  const { data: listData, error: listErr } = await admin
    .from("waitlists")
    .select(listSelect)
    .eq("display_token", token)
    .single();
  if (listErr && listErr.message.toLowerCase().includes("column")) {
    const { data: fallback, error: fbErr } = await admin
      .from("waitlists")
      .select("id, name, kiosk_enabled, business_id, location_id, seating_preferences, ask_name, ask_phone, ask_email, business_locations:location_id(regular_hours, timezone)")
      .eq("display_token", token)
      .single();
    if (fbErr || !fallback) return NextResponse.json({ error: "Invalid display token" }, { status: 404 });
    list = { ...fallback, display_enabled: true, display_show_name: false, display_show_qr: false };
  } else {
    if (listErr || !listData) return NextResponse.json({ error: "Invalid display token" }, { status: 404 });
    list = listData;
  }

  const loc = (list as unknown as { business_locations?: { regular_hours?: unknown; timezone?: unknown } | null }).business_locations;
  const openState = getLocationOpenState({
    regularHours: (loc?.regular_hours as RegularHours | null) || null,
    timezone: (typeof loc?.timezone === "string" ? (loc.timezone as string) : null) || null,
  });

  const displayEnabled = list.display_enabled !== false;
  const showNameOnDisplay = displayEnabled && list.display_show_name !== false && list.ask_name !== false;
  const showQrOnDisplay = displayEnabled && list.display_show_qr === true;

  const entriesSelect = showNameOnDisplay
    ? "id, status, queue_position, ticket_number, notified_at, party_size, seating_preference, customer_name"
    : "id, status, queue_position, ticket_number, notified_at, party_size, seating_preference";
  const { data: entries, error } = await admin
    .from("waitlist_entries")
    .select(entriesSelect)
    .eq("waitlist_id", list.id)
    .neq("status", "cancelled")
    .neq("status", "archived")
    .order("ticket_number", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Compute estimated wait time based on:
  // 1. Manual average_wait_minutes setting (if set)
  // 2. Historical data from seated entries
  // 3. Default 5-minute baseline when queue is empty
  let estimatedMs = 0;
  const manualAvgMinutes = typeof list.average_wait_minutes === "number" ? list.average_wait_minutes : null;
  try {
    const { data: served } = await admin
      .from("waitlist_entries")
      .select("created_at, notified_at")
      .eq("waitlist_id", list.id)
      .eq("status", "seated")
      .not("notified_at", "is", null)
      .order("notified_at", { ascending: false })
      .limit(100);
    const rows = (served || []) as { created_at: string; notified_at: string | null }[];
    const durationsMs = rows
      .map((r) => (r.notified_at ? new Date(r.notified_at).getTime() - new Date(r.created_at).getTime() : null))
      .filter((v): v is number => typeof v === "number" && isFinite(v) && v > 0);
    const historicalAvgMs = durationsMs.length ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length) : 0;
    
    // Blend manual setting with historical data if both exist
    // If manual setting exists, weight it 70% and historical 30%
    // If only manual exists, use it directly
    // If only historical exists, use it directly
    let avgMs = 0;
    if (manualAvgMinutes !== null && historicalAvgMs > 0) {
      avgMs = Math.round(manualAvgMinutes * 60 * 1000 * 0.7 + historicalAvgMs * 0.3);
    } else if (manualAvgMinutes !== null) {
      avgMs = manualAvgMinutes * 60 * 1000;
    } else {
      avgMs = historicalAvgMs;
    }
    
    // If queue is empty, set 5 minutes baseline (or manual setting if available)
    const { count: waitingCount } = await admin
      .from("waitlist_entries")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", list.id)
      .eq("status", "waiting");
    
    if ((waitingCount || 0) === 0) {
      estimatedMs = manualAvgMinutes !== null ? manualAvgMinutes * 60 * 1000 : 5 * 60 * 1000;
    } else {
      estimatedMs = avgMs > 0 ? avgMs : (manualAvgMinutes !== null ? manualAvgMinutes * 60 * 1000 : 5 * 60 * 1000);
    }
  } catch { }

  let businessCountry: string | null = null;
  let accentColor: string | null = null;
  let backgroundColor: string | null = null;
  let businessName: string | null = null;
  let brandLogo: string | null = null;
  if (list.business_id) {
    const { data: biz } = await admin
      .from("businesses")
      .select("name, logo_url, country_code, accent_color, background_color")
      .eq("id", list.business_id)
      .maybeSingle();
    businessCountry = (biz?.country_code as string | null) || null;
    accentColor = (biz?.accent_color as string | null) || null;
    backgroundColor = (biz?.background_color as string | null) || null;
    businessName = (biz?.name as string | null) || null;
    brandLogo = (biz?.logo_url as string | null) || null;
  }

  return NextResponse.json({
    listId: list.id,
    listName: list.name,
    kioskEnabled: !!list.kiosk_enabled,
    displayEnabled,
    showNameOnDisplay,
    showQrOnDisplay,
    locationIsOpen: openState.isOpen,
    locationStatusReason: openState.reason,
    askName: list.ask_name !== false,
    askPhone: list.ask_phone !== false,
    askEmail: list.ask_email === true,
    businessCountry,
    businessName,
    brandLogo,
    accentColor: accentColor || "#533AFD",
    backgroundColor: backgroundColor || "#000000",
    seatingPreferences: (list.seating_preferences as string[] | null) || [],
    estimatedMs,
    entries: entries ?? [],
  });
}


