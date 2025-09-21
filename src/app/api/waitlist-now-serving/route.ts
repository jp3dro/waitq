import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const waitlistId = searchParams.get("waitlistId");
  if (!waitlistId) return NextResponse.json({ error: "Missing waitlistId" }, { status: 400 });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("waitlist_entries")
    .select("ticket_number, notified_at, status")
    .eq("waitlist_id", waitlistId)
    .in("status", ["notified", "seated"]) // both are being/been served
    .order("notified_at", { ascending: false, nullsFirst: false })
    .order("ticket_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ticketNumber: data?.ticket_number ?? null });
}


