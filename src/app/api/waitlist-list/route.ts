import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const waitlistId = searchParams.get("waitlistId");
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!waitlistId) {
    return NextResponse.json({ error: "Missing waitlistId" }, { status: 400 });
  }

  // Authorize against the waitlist's business scope using RLS-protected queries.
  const { data: wl, error: wlErr } = await supabase
    .from("waitlists")
    .select("id, business_id")
    .eq("id", waitlistId)
    .maybeSingle();
  if (wlErr) return NextResponse.json({ error: wlErr.message }, { status: 400 });
  if (!wl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: biz } = await supabase
    .from("businesses")
    .select("owner_user_id")
    .eq("id", wl.business_id)
    .maybeSingle();
  const isOwner = (biz?.owner_user_id as string | undefined) === user.id;

  const { data: me } = await supabase
    .from("memberships")
    .select("role, status")
    .eq("business_id", wl.business_id)
    .eq("user_id", user.id)
    .maybeSingle();
  const isAdmin = isOwner || (me?.status === "active" && me?.role === "admin");
  const isActiveMember = isOwner || me?.status === "active";
  if (!isActiveMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Try to select with notification columns first
  // Only owners/admins can view PII (phone) and entry token.
  let selectFields = isAdmin
    ? "id, customer_name, phone, status, queue_position, created_at, ticket_number, token, send_sms, send_whatsapp, party_size, seating_preference, sms_message_id, sms_status, sms_sent_at, sms_delivered_at, sms_error_message, whatsapp_message_id, whatsapp_status, whatsapp_sent_at, whatsapp_delivered_at, whatsapp_error_message"
    : "id, customer_name, status, queue_position, created_at, ticket_number, party_size, seating_preference";

  let q = supabase
    .from("waitlist_entries")
    .select(selectFields)
    .neq("status", "archived") // exclude archived entries
    .not("ticket_number", "is", null); // show only current-cycle entries

  q = q.eq("waitlist_id", waitlistId);

  let { data, error } = await q.order("ticket_number", { ascending: true, nullsFirst: false });

  // If the query fails due to missing columns, retry without them
  if (error && (error.message.includes("send_sms") || error.message.includes("send_whatsapp") || error.message.includes("sms_message_id") || error.message.includes("whatsapp_message_id") || error.message.includes("column"))) {
    selectFields = isAdmin
      ? "id, customer_name, phone, status, queue_position, created_at, ticket_number, token, party_size, seating_preference"
      : "id, customer_name, status, queue_position, created_at, ticket_number, party_size, seating_preference";
    q = supabase
      .from("waitlist_entries")
      .select(selectFields)
      .neq("status", "archived")
      .not("ticket_number", "is", null);

    q = q.eq("waitlist_id", waitlistId);

    const retryResult = await q.order("ticket_number", { ascending: true, nullsFirst: false });
    data = retryResult.data;
    error = retryResult.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entries: data ?? [] });
}


