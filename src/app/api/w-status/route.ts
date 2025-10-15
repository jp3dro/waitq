import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

// Calculate ETA for all waiting entries in a waitlist
// Assumes average service time of 15 minutes per person
async function calculateAndUpdateETA(admin: ReturnType<typeof getAdminClient>, waitlistId: string) {
  // Get all waiting entries ordered by ticket number
  const { data: entries, error } = await admin
    .from("waitlist_entries")
    .select("id, ticket_number")
    .eq("waitlist_id", waitlistId)
    .eq("status", "waiting")
    .order("ticket_number", { ascending: true });

  if (error || !entries) return;

  // Get current serving number
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

  // Calculate ETA for each waiting entry
  const updates: { id: string; eta_minutes: number }[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const position = entry.ticket_number - currentServing - 1; // Position ahead in queue
    const etaMinutes = Math.max(0, position * 15); // 15 minutes per person, minimum 0
    updates.push({ id: entry.id, eta_minutes: etaMinutes });
  }

  // Update all entries in batch
  if (updates.length > 0) {
    await admin
      .from("waitlist_entries")
      .upsert(updates, { onConflict: 'id' });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const admin = getAdminClient();
  const { data: entry, error: e1 } = await admin
    .from("waitlist_entries")
    .select("status, created_at, eta_minutes, queue_position, token, waitlist_id, ticket_number, business_id, party_size, seating_preference")
    .eq("token", token)
    .single();
  if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });

  // If this entry doesn't have ETA calculated yet, calculate it for the entire waitlist
  if (entry?.waitlist_id && (entry.eta_minutes === null || entry.eta_minutes === undefined)) {
    await calculateAndUpdateETA(admin, entry.waitlist_id);
    // Re-fetch the entry with the newly calculated ETA
    const { data: updatedEntry } = await admin
      .from("waitlist_entries")
      .select("status, created_at, eta_minutes, queue_position, token, waitlist_id, ticket_number, business_id, party_size, seating_preference")
      .eq("token", token)
      .single();
    if (updatedEntry) {
      entry.eta_minutes = updatedEntry.eta_minutes;
    }
  }

  let nowServing: number | null = null;
  let business: { name: string | null; logo_url: string | null } | null = null;
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
  }

  if (entry?.business_id) {
    const { data: biz } = await admin
      .from("businesses")
      .select("name, logo_url")
      .eq("id", entry.business_id)
      .limit(1)
      .maybeSingle();
    if (biz) business = { name: (biz as { name: string | null; logo_url: string | null }).name ?? null, logo_url: (biz as { name: string | null; logo_url: string | null }).logo_url ?? null };
  }

  return NextResponse.json({ entry, nowServing, business });
}


