import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { sendSms, sendWhatsapp } from "@/lib/twilio";

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

const schema = z.object({
  waitlistId: z.string().uuid(),
  phone: z.string().min(8),
  customerName: z.string().min(1),
  sendSms: z.boolean().optional().default(false),
  sendWhatsapp: z.boolean().optional().default(false),
  partySize: z.number().int().positive().optional(),
  seatingPreference: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parse = schema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = nanoid(16);
  const { waitlistId, phone, customerName, sendSms: shouldSendSms, sendWhatsapp: shouldSendWhatsapp, partySize, seatingPreference } = parse.data;

  // Look up business_id from waitlist to keep entries consistent
  const { data: w, error: wErr } = await supabase
    .from("waitlists")
    .select("business_id")
    .eq("id", waitlistId)
    .single();
  if (wErr) return NextResponse.json({ error: wErr.message }, { status: 400 });

  // Compute next ticket number within this waitlist
  const { data: maxRow } = await supabase
    .from("waitlist_entries")
    .select("ticket_number")
    .eq("waitlist_id", waitlistId)
    .order("ticket_number", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const nextTicket = (maxRow?.ticket_number || 0) + 1;

  // Try to insert with notification preferences first
  let insertData: Record<string, unknown> = {
    business_id: w.business_id,
    waitlist_id: waitlistId,
    phone,
    customer_name: customerName,
    token,
    ticket_number: nextTicket,
    send_sms: shouldSendSms,
    send_whatsapp: shouldSendWhatsapp,
    party_size: typeof partySize === 'number' ? partySize : null,
    seating_preference: seatingPreference || null,
  };

  let { data, error } = await supabase
    .from("waitlist_entries")
    .insert(insertData)
    .select("id, token, ticket_number")
    .single();

  // If the insert fails due to missing columns, retry without them
  if (error && (error.message.includes("send_sms") || error.message.includes("send_whatsapp") || error.message.includes("column"))) {
    insertData = {
      business_id: w.business_id,
      waitlist_id: waitlistId,
      phone,
      customer_name: customerName,
      token,
      ticket_number: nextTicket,
      party_size: typeof partySize === 'number' ? partySize : null,
      seating_preference: seatingPreference || null,
    };

    const retryResult = await supabase
      .from("waitlist_entries")
      .insert(insertData)
      .select("id, token, ticket_number")
      .single();

    data = retryResult.data;
    error = retryResult.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (!data) return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });

  // Calculate ETA for all entries in this waitlist
  const admin = getAdminClient();
  await calculateAndUpdateETA(admin, waitlistId);

  const statusUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/w/${data.token}`;
  if (shouldSendSms || shouldSendWhatsapp) {
    try {
      const ticket = data.ticket_number ? ` #${data.ticket_number}` : "";
      // Fetch business name for branding
      let brand = "";
      const { data: biz } = await supabase
        .from("businesses")
        .select("name")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (biz?.name) brand = `${biz.name}: `;
      const message = `${brand}You're on the list${ticket}! Track your spot: ${statusUrl}`;
      if (shouldSendSms) {
        await sendSms(phone, message);
      }
      if (shouldSendWhatsapp) {
        await sendWhatsapp(phone, message);
      }
    } catch {
      // proceed even if SMS fails
    }
  }

  return NextResponse.json({ id: data.id, token: data.token, statusUrl, ticketNumber: data.ticket_number ?? null }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Use service role for hard delete regardless of RLS
  const admin = getAdminClient();
  const { error } = await admin.from("waitlist_entries").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["call"]).optional(),
  status: z.enum(["waiting", "notified", "seated", "cancelled"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const json = await req.json();
  const parse = patchSchema.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, status } = parse.data;
  let payload: Record<string, unknown> = {};
  if (action === "call") {
    payload = { status: "notified", notified_at: new Date().toISOString() };
  } else if (status) {
    payload = { status };
  } else {
    return NextResponse.json({ error: "No update specified" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("waitlist_entries")
    .update(payload)
    .eq("id", id)
    .select("id, status, ticket_number, waitlist_id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Recalculate ETA for all entries in this waitlist when status changes
  if (data?.waitlist_id && (action === "call" || status)) {
    const admin = getAdminClient();
    await calculateAndUpdateETA(admin, data.waitlist_id);
  }

  return NextResponse.json({ entry: data });
}


