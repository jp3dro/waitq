import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { broadcastRefresh } from "@/lib/realtime-broadcast";

async function calculateAndUpdateETA(admin: ReturnType<typeof getAdminClient>, waitlistId: string) {
  const { data: entries, error } = await admin
    .from("waitlist_entries")
    .select("id, ticket_number")
    .eq("waitlist_id", waitlistId)
    .eq("status", "waiting")
    .order("ticket_number", { ascending: true });

  if (error || !entries) return;

  const { data: serving } = await admin
    .from("waitlist_entries")
    .select("ticket_number")
    .eq("waitlist_id", waitlistId)
    .in("status", ["notified", "seated"])
    .order("notified_at", { ascending: false, nullsFirst: false })
    .order("ticket_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentServing = serving?.ticket_number || 0;
  const updates: { id: string; eta_minutes: number }[] = [];
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const position = entry.ticket_number - currentServing - 1;
    const etaMinutes = Math.max(0, position * 15);
    updates.push({ id: entry.id, eta_minutes: etaMinutes });
  }

  if (updates.length > 0) {
    await admin.from("waitlist_entries").upsert(updates, { onConflict: "id" });
  }
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const token = typeof json?.token === "string" ? json.token.trim() : "";
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const admin = getAdminClient();
  const { data: entry, error } = await admin
    .from("waitlist_entries")
    .select("id, status, waitlist_id, token")
    .eq("token", token)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!["waiting", "notified"].includes(entry.status)) {
    return NextResponse.json({ error: "Ticket cannot be cancelled" }, { status: 409 });
  }

  const { error: updErr } = await admin
    .from("waitlist_entries")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", entry.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

  if (entry.waitlist_id) {
    try {
      await calculateAndUpdateETA(admin, entry.waitlist_id);
    } catch { }
  }

  let displayToken: string | null = null;
  if (entry.waitlist_id) {
    const { data: wl } = await admin
      .from("waitlists")
      .select("display_token")
      .eq("id", entry.waitlist_id)
      .maybeSingle();
    displayToken = (wl?.display_token as string | null) || null;
  }

  try {
    await Promise.all([
      broadcastRefresh(`w-status-${entry.token}`),
      entry.waitlist_id ? broadcastRefresh(`user-wl-${entry.waitlist_id}`) : Promise.resolve(),
      entry.waitlist_id ? broadcastRefresh(`waitlist-entries-${entry.waitlist_id}`) : Promise.resolve(),
      displayToken ? broadcastRefresh(`display-bc-${displayToken}`) : Promise.resolve(),
    ]);
  } catch { }

  return NextResponse.json({ ok: true });
}
