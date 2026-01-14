import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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
  const { data: list, error: listErr } = await admin
    .from("waitlists")
    .select("id, name, kiosk_enabled, business_id, seating_preferences, ask_name, ask_phone")
    .eq("display_token", token)
    .single();
  if (listErr || !list) return NextResponse.json({ error: "Invalid display token" }, { status: 404 });

  const { data: entries, error } = await admin
    .from("waitlist_entries")
    .select("id, status, queue_position, ticket_number, notified_at, party_size, seating_preference")
    .eq("waitlist_id", list.id)
    .order("ticket_number", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Compute estimated wait time based on seated entries; apply 5-minute floor when queue is empty
  let estimatedMs = 0;
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
    const avg = durationsMs.length ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length) : 0;
    // If queue is empty, set 5 minutes baseline
    const { count: waitingCount } = await admin
      .from("waitlist_entries")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", list.id)
      .eq("status", "waiting");
    estimatedMs = (waitingCount || 0) === 0 ? 5 * 60 * 1000 : avg;
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
    askName: list.ask_name !== false,
    askPhone: list.ask_phone !== false,
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


