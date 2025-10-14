import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const admin = getAdminClient();
  const { data: list, error: listErr } = await admin
    .from("waitlists")
    .select("id, name, kiosk_enabled, business_id, list_type, seating_preferences")
    .eq("display_token", token)
    .single();
  if (listErr || !list) return NextResponse.json({ error: "Invalid display token" }, { status: 404 });

  const { data: entries, error } = await admin
    .from("waitlist_entries")
    .select("id, status, queue_position, ticket_number, notified_at, party_size, seating_preference")
    .eq("waitlist_id", list.id)
    .order("ticket_number", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Compute estimated wait time (average duration from created_at to notified_at of recent entries)
  let estimatedMs = 0;
  try {
    const { data: served } = await admin
      .from("waitlist_entries")
      .select("created_at, notified_at")
      .eq("waitlist_id", list.id)
      .not("notified_at", "is", null)
      .order("notified_at", { ascending: false })
      .limit(100);
    const rows = (served || []) as { created_at: string; notified_at: string | null }[];
    const durationsMs = rows
      .map((r) => (r.notified_at ? new Date(r.notified_at).getTime() - new Date(r.created_at).getTime() : null))
      .filter((v): v is number => typeof v === "number" && isFinite(v) && v > 0);
    estimatedMs = durationsMs.length ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length) : 0;
  } catch {}

  let businessCountry: string | null = null;
  if (list.business_id) {
    const { data: biz } = await admin
      .from("businesses")
      .select("country_code")
      .eq("id", list.business_id)
      .maybeSingle();
    businessCountry = (biz?.country_code as string | null) || null;
  }

  return NextResponse.json({
    listId: list.id,
    listName: list.name,
    kioskEnabled: !!list.kiosk_enabled,
    businessCountry,
    listType: list.list_type,
    seatingPreferences: (list.seating_preferences as string[] | null) || [],
    estimatedMs,
    entries: entries ?? [],
  });
}


