import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { nanoid } from "nanoid";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { broadcastRefresh } from "@/lib/realtime-broadcast";
import { resend } from "@/lib/resend";
import { normalizePhone } from "@/lib/phone";
import { countEntriesInPeriod, getPlanContext } from "@/lib/plan-limits";
import { getLocationOpenState, type RegularHours } from "@/lib/location-hours";

const schema = z.object({
  token: z.string().min(1),
  phone: z.string().optional(),
  name: z.string().optional(),
  email: z
    .string()
    .optional()
    .transform((v) => (typeof v === "string" ? v.trim() : undefined))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email"),
  partySize: z.number().int().positive().optional(),
  seatingPreference: z.string().optional(),
});

function escapeHtml(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildWaitlistEmailHtml(opts: { businessName?: string | null; ticketNumber?: number | null; statusUrl: string }) {
  const safeBiz = escapeHtml((opts.businessName || "").trim());
  const safeUrl = escapeHtml(opts.statusUrl);
  const ticket = typeof opts.ticketNumber === "number" ? `#${opts.ticketNumber}` : "";
  const safeTicket = escapeHtml(ticket);
  return `
  <body style="margin:0;background-color:#f8fafc;padding:32px 0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;padding:0 24px;">
            <tr>
              <td>
                <div style="background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 18px 34px rgba(15,23,42,0.10);">
                  <div style="padding:28px 28px 20px;">
                    <div style="text-transform:uppercase;font-size:12px;letter-spacing:2px;font-weight:700;color:#0f172a;">Your ticket</div>
                    <h1 style="margin:10px 0 8px;font-size:24px;line-height:1.25;color:#0f172a;">${safeBiz ? safeBiz : "WaitQ"} ${safeTicket ? safeTicket : ""}</h1>
                    <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#475569;">You can follow the queue progress here:</p>
                    <div style="margin:18px 0;">
                      <a href="${safeUrl}" style="display:inline-flex;align-items:center;justify-content:center;padding:12px 22px;border-radius:999px;background-color:#FF9500;color:#111827;font-weight:700;text-decoration:none;border:1px solid #ea580c;">Open status</a>
                    </div>
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">If the button doesn't work, copy and paste this link:<br /><a href="${safeUrl}" style="color:#111827;text-decoration:underline;">${safeUrl}</a></p>
                  </div>
                </div>
                <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px;line-height:1.5;">Powered by WaitQ</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  `;
}

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

  const { token: displayToken, phone, name, email, partySize, seatingPreference } = parse.data;
  const normalizedEmail = typeof email === "string" && email.trim().length ? email.trim().toLowerCase() : undefined;

  const admin = getAdminClient();

  // Find the waitlist by display token and ensure kiosk is enabled
  const { data: list, error: listErr } = await admin
    .from("waitlists")
    .select("id, business_id, kiosk_enabled, ask_name, ask_phone, location_id")
    .eq("display_token", displayToken)
    .single();
  if (listErr || !list) return NextResponse.json({ error: "Invalid display token" }, { status: 404 });
  if (!list.kiosk_enabled) return NextResponse.json({ error: "Kiosk is disabled" }, { status: 403 });

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


  // Validate required fields based on settings
  if (list.ask_phone !== false && !phone) return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  if (list.ask_name !== false && !name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const normalizedPhone = normalizePhone(phone);
  if (phone && !normalizedPhone) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });

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
      const msg =
        ctx.planId === "free"
          ? "Waitlist limit reached for the free plan. Upgrade to add more people."
          : "Monthly waitlist limit reached for your plan";
      return NextResponse.json({ error: msg }, { status: 403 });
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
    })
    .select("id, token, ticket_number")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const statusUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/w/${data.token}`;

  // Email confirmation (ticket + status link)
  if (normalizedEmail) {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn("[kiosk-email] RESEND_API_KEY missing; email not sent", { email: normalizedEmail });
      } else {
        const { data: biz } = await admin.from("businesses").select("name").eq("id", list.business_id).maybeSingle();
        const businessName = (biz?.name as string | undefined) ?? null;
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "WaitQ <noreply@waitq.com>",
          replyTo: process.env.RESEND_REPLY_TO_EMAIL,
          to: normalizedEmail,
          subject: `${businessName ? businessName : "WaitQ"} ticket ${typeof data.ticket_number === "number" ? `#${data.ticket_number}` : ""}`.trim(),
          html: buildWaitlistEmailHtml({
            businessName,
            ticketNumber: data.ticket_number ?? null,
            statusUrl,
          }),
        });
      }
    } catch (e) {
      console.error("[kiosk-email] Failed to send ticket email", e);
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

  return NextResponse.json(
    { id: data.id, token: data.token, statusUrl, ticketNumber: data.ticket_number ?? null },
    { status: 201 }
  );
}


