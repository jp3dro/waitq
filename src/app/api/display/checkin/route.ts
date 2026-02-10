import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { nanoid } from "nanoid";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { broadcastRefresh } from "@/lib/realtime-broadcast";
import { resend } from "@/lib/resend";
import { normalizePhone } from "@/lib/phone";
import { countEntriesInPeriod, countSmsInPeriod, getPlanContext } from "@/lib/plan-limits";
import { getLocationOpenState, type RegularHours } from "@/lib/location-hours";
import { buildWaitlistTicketEmailHtml } from "@/lib/email-templates";
import { joinedMessage } from "@/lib/sms-templates";
import { getPostHogClient } from "@/lib/posthog-server";
import { sendSms } from "@/lib/bulkgate";

const schema = z.object({
  token: z.string().min(1),
  phone: z.string().optional(),
  name: z.string().optional(),
  email: z
    .string()
    .optional()
    .transform((v) => (typeof v === "string" ? v.trim() : undefined))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email"),
  sendSms: z.boolean().optional().default(false),
  sendEmail: z.boolean().optional().default(false),
  partySize: z.number().int().positive().max(30, "Maximum 30 people allowed").optional(),
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

  const { token: displayToken, phone, name, email, sendSms: shouldSendSms, sendEmail: shouldSendEmail, partySize, seatingPreference } = parse.data;
  const normalizedEmail = typeof email === "string" && email.trim().length ? email.trim().toLowerCase() : undefined;

  const admin = getAdminClient();

  // Find the waitlist by display token
  const { data: list, error: listErr } = await admin
    .from("waitlists")
    .select("id, business_id, ask_name, ask_phone, location_id")
    .eq("display_token", displayToken)
    .single();
  if (listErr || !list) return NextResponse.json({ error: "Invalid display token" }, { status: 404 });

  // Enforce location regular hours: do not accept new entries when closed.
  try {
    const locationId = (list as unknown as { location_id?: string | null }).location_id || null;
    if (locationId) {
      const { data: loc } = await admin
        .from("business_locations")
        .select("regular_hours, timezone")
        .eq("id", locationId)
        .maybeSingle();
      const openState = getLocationOpenState({
        regularHours: (loc?.regular_hours as RegularHours | null) || null,
        timezone: (loc?.timezone as string | null) || null,
      });
      if (!openState.isOpen) {
        return NextResponse.json({ error: openState.reason || "Restaurant is closed" }, { status: 403 });
      }
    }
  } catch {
    return NextResponse.json({ error: "Restaurant is closed" }, { status: 403 });
  }


  // Validate fields - name is required if ask_name is enabled, phone and email are always optional
  if (list.ask_name !== false && !name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const normalizedPhone = normalizePhone(phone);
  if (phone && !normalizedPhone) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  if (shouldSendSms && !normalizedPhone) return NextResponse.json({ error: "Phone is required to send SMS" }, { status: 400 });
  if (shouldSendEmail && !normalizedEmail) return NextResponse.json({ error: "Email is required to send email" }, { status: 400 });

  if (normalizedPhone) {
    const { data: existing } = await admin
      .from("waitlist_entries")
      .select("id")
      .eq("waitlist_id", list.id)
      .eq("phone", normalizedPhone)
      .in("status", ["waiting", "notified"])
      .not("ticket_number", "is", null)
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      return NextResponse.json({ error: "Phone number already waiting" }, { status: 409 });
    }
  }
  if (normalizedEmail) {
    const { data: existing } = await admin
      .from("waitlist_entries")
      .select("id")
      .eq("waitlist_id", list.id)
      .ilike("email", normalizedEmail)
      .in("status", ["waiting", "notified"])
      .not("ticket_number", "is", null)
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      return NextResponse.json({ error: "Email already waiting" }, { status: 409 });
    }
  }

  if (list.business_id) {
    const ctx = await getPlanContext(list.business_id);
    const usedEntries = await countEntriesInPeriod(list.business_id, ctx.window.start, ctx.window.end);
    if (usedEntries >= ctx.limits.reservationsPerMonth) {
      // For public kiosk check-in, return a safe message; internal UI can use `upgradeTo` if needed.
      const upgradeTo = ctx.planId === "free" ? "base" : ctx.planId === "base" ? "premium" : null;
      const msg = "Waitlist is temporarily unavailable. Please ask the staff for help.";
      return NextResponse.json({ error: msg, upgradeTo }, { status: 403 });
    }
  }

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
      phone: normalizedPhone || null,
      email: normalizedEmail || null,
      customer_name: name || null,
      token: entryToken,
      ticket_number: nextTicket,
      party_size: typeof partySize === 'number' ? partySize : null,
      seating_preference: seatingPreference || null,
      send_sms: shouldSendSms,
      send_email: shouldSendEmail,
    })
    .select("id, token, ticket_number")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const statusUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/w/${data.token}`;

  // Fetch business name once if we will send any notifications (SMS/Email).
  let businessName: string | null = null;
  if (list.business_id && (shouldSendEmail || shouldSendSms)) {
    try {
      const { data: biz } = await admin.from("businesses").select("name").eq("id", list.business_id).maybeSingle();
      businessName = (biz?.name as string | undefined) ?? null;
    } catch {
      businessName = null;
    }
  }

  // Email confirmation (ticket + status link)
  if (shouldSendEmail && normalizedEmail) {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn("[kiosk-email] RESEND_API_KEY missing; email not sent", { email: normalizedEmail });
      } else {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://waitq.com";
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "WaitQ <noreply@waitq.com>",
          replyTo: process.env.RESEND_REPLY_TO_EMAIL,
          to: normalizedEmail,
          subject: `${businessName ? businessName : "WaitQ"} ticket ${typeof data.ticket_number === "number" ? `#${data.ticket_number}` : ""}`.trim(),
          html: buildWaitlistTicketEmailHtml({
            businessName,
            ticketNumber: data.ticket_number ?? null,
            statusUrl,
            siteUrl,
          }),
        });
      }
    } catch (e) {
      console.error("[kiosk-email] Failed to send ticket email", e);
    }
  }

  // SMS confirmation (ticket + status link)
  if (shouldSendSms && normalizedPhone) {
    try {
      if (list.business_id) {
        const ctx = await getPlanContext(list.business_id);
        const usedSms = await countSmsInPeriod(list.business_id, ctx.window.start, ctx.window.end);
        if (usedSms < ctx.limits.messagesPerMonth) {
          const built = joinedMessage({ businessName, ticketNumber: data.ticket_number ?? null, statusUrl });
          await sendSms(normalizedPhone, built.text, { variables: built.variables });
        } else {
          console.warn("[kiosk-sms] SMS limit reached; skipping SMS send");
        }
      }
    } catch (e) {
      console.error("[kiosk-sms] Failed to send ticket SMS", e);
    }
  }

  // Best-effort: refresh public display + personal status page
  try {
    await Promise.all([
      broadcastRefresh(`display-bc-${displayToken}`),
      broadcastRefresh(`waitlist-entries-${list.id}`),
      broadcastRefresh(`user-wl-${list.id}`),
      broadcastRefresh(`w-status-${data.token}`),
    ]);
  } catch { }

  // Track customer self check-in (anonymous event with business context)
  try {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: `anon_kiosk_${ip}`, // Anonymous distinct ID for kiosk check-ins
      event: 'customer_self_checkin',
      properties: {
        waitlist_id: list.id,
        business_id: list.business_id,
        party_size: partySize || null,
        has_phone: !!normalizedPhone,
        has_email: !!normalizedEmail,
        seating_preference: seatingPreference || null,
      }
    });
  } catch { }

  return NextResponse.json(
    { id: data.id, token: data.token, statusUrl, ticketNumber: data.ticket_number ?? null },
    { status: 201 }
  );
}


