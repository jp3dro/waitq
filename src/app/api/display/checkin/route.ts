import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { nanoid } from "nanoid";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(1),
  phone: z.string().min(8),
  partySize: z.number().int().positive().optional(),
  seatingPreference: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit({ key: `kiosk:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const json = await req.json().catch(() => ({}));
  const parse = schema.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const { token: displayToken, phone, partySize, seatingPreference } = parse.data;

  const admin = getAdminClient();

  // Find the waitlist by display token and ensure kiosk is enabled
  const { data: list, error: listErr } = await admin
    .from("waitlists")
    .select("id, business_id, kiosk_enabled")
    .eq("display_token", displayToken)
    .single();
  if (listErr || !list) return NextResponse.json({ error: "Invalid display token" }, { status: 404 });
  if (!list.kiosk_enabled) return NextResponse.json({ error: "Kiosk is disabled" }, { status: 403 });

  // Compute next ticket number
  const { data: maxRow } = await admin
    .from("waitlist_entries")
    .select("ticket_number")
    .eq("waitlist_id", list.id)
    .order("ticket_number", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const nextTicket = (maxRow?.ticket_number || 0) + 1;

  const entryToken = nanoid(16);

  const { data, error } = await admin
    .from("waitlist_entries")
    .insert({
      business_id: list.business_id,
      waitlist_id: list.id,
      phone,
      // customer_name intentionally omitted in kiosk mode
      token: entryToken,
      ticket_number: nextTicket,
      party_size: typeof partySize === 'number' ? partySize : null,
      seating_preference: seatingPreference || null,
    })
    .select("id, token, ticket_number")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const statusUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/w/${data.token}`;
  return NextResponse.json(
    { id: data.id, token: data.token, statusUrl, ticketNumber: data.ticket_number ?? null },
    { status: 201 }
  );
}


