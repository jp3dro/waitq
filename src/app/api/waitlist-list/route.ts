import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const waitlistId = searchParams.get("waitlistId");
  const supabase = await createRouteClient();
  // Try to select with notification columns first
  let selectFields = "id, customer_name, phone, status, queue_position, created_at, ticket_number, token, send_sms, send_whatsapp, party_size, seating_preference";

  let q = supabase
    .from("waitlist_entries")
    .select(selectFields)
    .not("ticket_number", "is", null); // show only current-cycle entries

  if (waitlistId) {
    q = q.eq("waitlist_id", waitlistId);
  }

  let { data, error } = await q.order("ticket_number", { ascending: true, nullsFirst: false });

  // If the query fails due to missing columns, retry without them
  if (error && (error.message.includes("send_sms") || error.message.includes("send_whatsapp") || error.message.includes("column"))) {
    selectFields = "id, customer_name, phone, status, queue_position, created_at, ticket_number, token, party_size, seating_preference";
    q = supabase
      .from("waitlist_entries")
      .select(selectFields)
      .not("ticket_number", "is", null);

    if (waitlistId) {
      q = q.eq("waitlist_id", waitlistId);
    }

    const retryResult = await q.order("ticket_number", { ascending: true, nullsFirst: false });
    data = retryResult.data;
    error = retryResult.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entries: data ?? [] });
}


