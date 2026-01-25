import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { broadcastRefresh } from "@/lib/realtime-broadcast";
import { z } from "zod";
import { sendSms, sendWhatsapp } from "@/lib/bulkgate";
import { resend } from "@/lib/resend";
import { normalizePhone } from "@/lib/phone";
import { countEntriesInPeriod, countSmsInPeriod, getPlanContext } from "@/lib/plan-limits";
import { getLocationOpenState, type RegularHours } from "@/lib/location-hours";
import { buildWaitlistTicketEmailHtml } from "@/lib/email-templates";
import { resolveCurrentBusinessId } from "@/lib/current-business";

function getBulkGateMessageId(resp: unknown): string | null {
  const r = resp as { data?: Record<string, unknown> } | null | undefined;
  const v = r?.data?.message_id;
  return typeof v === "string" && v.length ? v : null;
}

function getBulkGateChannel(resp: unknown): string | null {
  const r = resp as { data?: Record<string, unknown> } | null | undefined;
  const v = r?.data?.channel;
  return typeof v === "string" && v.length ? v : null;
}

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
  // Phone is optional. We validate the actual number later via `normalizePhone`.
  phone: z.string().optional(),
  customerName: z.string().optional(),
  email: z
    .string()
    .optional()
    .transform((v) => (typeof v === "string" ? v.trim() : undefined))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email"),
  sendSms: z.boolean().optional().default(false),
  sendWhatsapp: z.boolean().optional().default(false),
  sendEmail: z.boolean().optional().default(false),
  partySize: z.number().int().positive().max(30, "Maximum 30 people allowed").optional(),
  seatingPreference: z.string().optional(),
});

function buildWaitlistNotificationMessage(opts: { businessName?: string | null; ticketNumber?: number | null; statusUrl: string }) {
  const businessName = (opts.businessName || "").trim();
  const brandPrefix = businessName ? `${businessName}: ` : "";
  const ticketSuffix = opts.ticketNumber ? ` #${opts.ticketNumber}` : "";
  const text = `${brandPrefix}You're ${ticketSuffix} on the list. Follow the progress here: ${opts.statusUrl}`;
  const variables = {
    brand: businessName,
    ticket: (opts.ticketNumber || "").toString(),
    link: opts.statusUrl,
  };
  const templateParams = [businessName, (opts.ticketNumber || "").toString(), opts.statusUrl];
  return { text, variables, templateParams };
}

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

  const businessId = await resolveCurrentBusinessId(supabase as any, user.id);
  if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const token = nanoid(16);
  const { waitlistId, phone, customerName, email, sendSms: shouldSendSms, sendWhatsapp: shouldSendWhatsapp, sendEmail: shouldSendEmail, partySize, seatingPreference } = parse.data;
  const normalizedEmail = typeof email === "string" && email.trim().length ? email.trim().toLowerCase() : undefined;

  // Look up business_id and settings from waitlist
  const admin = getAdminClient();
  const { data: w, error: wErr } = await admin
    .from("waitlists")
    .select("business_id, name, ask_name, ask_phone, ask_email, location_id")
    .eq("id", waitlistId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (wErr) return NextResponse.json({ error: wErr.message }, { status: 400 });
  if (!w) return NextResponse.json({ error: "Waitlist not found or access denied" }, { status: 404 });

  // Enforce location regular hours: do not accept new entries when closed.
  try {
    const locationId = (w as unknown as { location_id?: string | null }).location_id || null;
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
    // If we can't check hours, fail closed to prevent accepting entries unexpectedly.
    return NextResponse.json({ error: "Restaurant is closed" }, { status: 403 });
  }

  // Validate required fields based on settings
  if (w.ask_name !== false && !customerName) {
    return NextResponse.json({
      error: {
        fieldErrors: { customerName: ["Name is required"] },
        message: "Name is required"
      }
    }, { status: 400 });
  }
  // Phone is optional (even when configured to collect phone). Only require it if user opted into SMS/WhatsApp.
  const rawPhone = typeof phone === "string" ? phone.trim() : "";
  const digits = rawPhone.replace(/\D/g, "");
  const hasMeaningfulPhone = digits.length >= 8; // avoid failing when the input only contains country prefix
  const normalizedPhone = hasMeaningfulPhone ? normalizePhone(rawPhone) : null;
  if ((shouldSendSms || shouldSendWhatsapp) && !normalizedPhone) {
    return NextResponse.json({
      error: {
        fieldErrors: { phone: ["Phone is required to send SMS/WhatsApp"] },
        message: "Phone is required to send SMS/WhatsApp",
      }
    }, { status: 400 });
  }
  if (hasMeaningfulPhone && !normalizedPhone) {
    return NextResponse.json({
      error: {
        fieldErrors: { phone: ["Invalid phone number"] },
        message: "Invalid phone number"
      }
    }, { status: 400 });
  }
  if (shouldSendEmail && !normalizedEmail) {
    return NextResponse.json({
      error: {
        fieldErrors: { email: ["Email is required to send an email notification"] },
        message: "Email is required to send an email notification",
      }
    }, { status: 400 });
  }

  if (w.business_id) {
    const ctx = await getPlanContext(w.business_id);
    const usedEntries = await countEntriesInPeriod(w.business_id, ctx.window.start, ctx.window.end);
    if (usedEntries >= ctx.limits.reservationsPerMonth) {
      const upgradeTo = ctx.planId === "free" ? "base" : ctx.planId === "base" ? "premium" : null;
      const msg =
        ctx.planId === "free"
          ? "Waitlist limit reached for the Free plan. Upgrade to add more people."
          : ctx.planId === "base"
            ? "Waitlist limit reached for the Base plan. Upgrade to Premium to add more people."
            : "Monthly waitlist limit reached for your plan";
      return NextResponse.json({ error: msg, upgradeTo }, { status: 403 });
    }
  }

  if (normalizedPhone) {
    const { data: existing } = await admin
      .from("waitlist_entries")
      .select("id")
      .eq("waitlist_id", waitlistId)
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
      .eq("waitlist_id", waitlistId)
      .ilike("email", normalizedEmail)
      .in("status", ["waiting", "notified"])
      .not("ticket_number", "is", null)
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      return NextResponse.json({ error: "Email already waiting" }, { status: 409 });
    }
  }

  // Compute next ticket number within this waitlist
  const { data: maxRow } = await admin
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
    phone: normalizedPhone,
    email: normalizedEmail || null,
    customer_name: customerName,
    token,
    ticket_number: nextTicket,
    send_sms: shouldSendSms,
    send_whatsapp: shouldSendWhatsapp,
    send_email: shouldSendEmail,
    party_size: typeof partySize === 'number' ? partySize : null,
    seating_preference: seatingPreference || null,
  };

  let { data, error } = await admin
    .from("waitlist_entries")
    .insert(insertData)
    .select("id, token, ticket_number")
    .single();

  // If the insert fails due to missing columns, retry without them
  if (error && (error.message.includes("send_sms") || error.message.includes("send_whatsapp") || error.message.includes("send_email") || error.message.includes("column"))) {
    insertData = {
      business_id: w.business_id,
      waitlist_id: waitlistId,
      phone: normalizedPhone,
      email: normalizedEmail || null,
      customer_name: customerName,
      token,
      ticket_number: nextTicket,
      party_size: typeof partySize === 'number' ? partySize : null,
      seating_preference: seatingPreference || null,
    };

    const retryResult = await admin
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
  await calculateAndUpdateETA(admin, waitlistId);

  const statusUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/w/${data.token}`;

  // Fetch business name if we will send any notifications (SMS/WhatsApp/Email).
  let businessName: string | null = null;
  if ((shouldSendSms || shouldSendWhatsapp || shouldSendEmail) && w.business_id) {
    try {
      const { data: biz } = await admin.from("businesses").select("name").eq("id", w.business_id).maybeSingle();
      businessName = (biz?.name as string | undefined) ?? null;
    } catch { }
  }

  // Email notification (ticket + details + status link)
  if (shouldSendEmail && normalizedEmail) {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn("[waitlist-email] RESEND_API_KEY missing; email not sent", { email: normalizedEmail });
      } else {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://waitq.com";
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "WaitQ <noreply@waitq.com>",
          replyTo: process.env.RESEND_REPLY_TO_EMAIL,
          to: normalizedEmail,
          subject: `${businessName ? businessName : "WaitQ"} ticket ${typeof data.ticket_number === "number" ? `#${data.ticket_number}` : ""}`.trim(),
          html: buildWaitlistTicketEmailHtml({
            businessName,
            waitlistName: (w as any)?.name ?? null,
            customerName: customerName ?? null,
            ticketNumber: data.ticket_number ?? null,
            partySize: typeof partySize === "number" ? partySize : null,
            seatingPreference: seatingPreference || null,
            statusUrl,
            siteUrl,
          }),
        });
      }
    } catch (e) {
      console.error("[waitlist-email] Failed to send ticket email", e);
    }
  }

  if (shouldSendSms || shouldSendWhatsapp) {
    try {
      const built = buildWaitlistNotificationMessage({
        businessName,
        ticketNumber: data.ticket_number ?? null,
        statusUrl,
      });
      const message = built.text;
      const variables = built.variables;
      const templateParams = built.templateParams;
      if (shouldSendSms && normalizedPhone) {
        if (w.business_id) {
          const ctx = await getPlanContext(w.business_id);
          const usedSms = await countSmsInPeriod(w.business_id, ctx.window.start, ctx.window.end);
          if (usedSms >= ctx.limits.messagesPerMonth) {
            const upgradeTo = ctx.planId === "free" ? "base" : ctx.planId === "base" ? "premium" : null;
            const msg =
              ctx.planId === "free"
                ? "SMS limit reached for the Free plan. Upgrade to send more messages."
                : ctx.planId === "base"
                  ? "SMS limit reached for the Base plan. Upgrade to Premium to send more messages."
                  : "Monthly SMS limit reached for your plan";
            return NextResponse.json({ error: msg, upgradeTo }, { status: 403 });
          }
        }
        try {
          const resp = await sendSms(normalizedPhone, message, { variables });
          console.log("[Waitlist] SMS sent", resp);

          // Update the entry with SMS message ID and initial status
          const messageId = getBulkGateMessageId(resp);
          if (messageId) {
            await admin
              .from("waitlist_entries")
              .update({
                sms_message_id: messageId,
                sms_status: 'sent', // BulkGate returns 'accepted' which we map to 'sent'
                sms_sent_at: new Date().toISOString()
              })
              .eq("id", data.id);

            // Insert into notification_logs for tracking
            await admin
              .from("notification_logs")
              .insert({
                user_id: user.id,
                waitlist_entry_id: data.id,
                message_type: 'sms',
                message_id: messageId,
                phone_number: normalizedPhone,
                status: 'sent',
                sent_at: new Date().toISOString(),
                message_text: message
              });
          }
        } catch (err) {
          console.error("[Waitlist] SMS error", err);
          const errMsg = err instanceof Error ? err.message : String(err);
          // Update with failed status
          await admin
            .from("waitlist_entries")
            .update({
              sms_status: 'failed',
              sms_error_message: errMsg
            })
            .eq("id", data.id);

          // Insert failed SMS log
          await admin
            .from("notification_logs")
            .insert({
              user_id: user.id,
              waitlist_entry_id: data.id,
              message_type: 'sms',
              message_id: `failed-${Date.now()}`, // Generate a unique ID for failed messages
              phone_number: normalizedPhone,
              status: 'failed',
              error_message: errMsg,
              message_text: message
            });
        }
      }
      if (shouldSendWhatsapp && normalizedPhone) {
        try {
          const resp = await sendWhatsapp(normalizedPhone, message, { templateParams, variables });
          const actualChannel = getBulkGateChannel(resp) || "whatsapp";
          console.log(`[Waitlist] Notification sent (${actualChannel})`, resp);

          const messageId = getBulkGateMessageId(resp);
          if (messageId) {
            const nowIso = new Date().toISOString();

            if (actualChannel === "sms") {
              // Provider reported SMS even though we attempted WhatsApp. Persist what actually happened.
              await admin
                .from("waitlist_entries")
                .update({
                  sms_message_id: messageId,
                  sms_status: "sent",
                  sms_sent_at: nowIso,
                })
                .eq("id", data.id);
            } else {
              await admin
                .from("waitlist_entries")
                .update({
                  whatsapp_message_id: messageId,
                  whatsapp_status: "sent", // BulkGate returns 'accepted' which we map to 'sent'
                  whatsapp_sent_at: nowIso,
                })
                .eq("id", data.id);
            }

            await admin.from("notification_logs").insert({
              user_id: user.id,
              waitlist_entry_id: data.id,
              message_type: actualChannel === "sms" ? "sms" : "whatsapp",
              message_id: messageId,
              phone_number: normalizedPhone,
              status: "sent",
              sent_at: nowIso,
              message_text: message,
            });
          }
        } catch (err) {
          console.error("[Waitlist] WhatsApp error", err);
          const errMsg = err instanceof Error ? err.message : String(err);
          // Update with failed status
          await admin
            .from("waitlist_entries")
            .update({
              whatsapp_status: 'failed',
              whatsapp_error_message: errMsg
            })
            .eq("id", data.id);

          // Insert failed WhatsApp log
          await admin
            .from("notification_logs")
            .insert({
              user_id: user.id,
              waitlist_entry_id: data.id,
              message_type: 'whatsapp',
              message_id: `failed-${Date.now()}`, // Generate a unique ID for failed messages
              phone_number: normalizedPhone,
              status: 'failed',
              error_message: errMsg,
              message_text: message
            });
        }
      }
    } catch (e) {
      console.error("[Waitlist] Notification block error", e);
    }
  }

  // Best-effort: notify public pages + displays to refetch (no PII in payload).
  try {
    await Promise.all([
      broadcastRefresh(`w-status-${data.token}`),
      broadcastRefresh(`user-wl-${waitlistId}`),
      broadcastRefresh(`waitlist-entries-${waitlistId}`),
      // display refresh uses the display token (if any)
      (async () => {
        const { data: wl } = await admin.from("waitlists").select("display_token").eq("id", waitlistId).maybeSingle();
        const dt = (wl?.display_token as string | null) || null;
        if (dt) await broadcastRefresh(`display-bc-${dt}`);
      })(),
    ]);
  } catch { }

  return NextResponse.json({ id: data.id, token: data.token, statusUrl, ticketNumber: data.ticket_number ?? null }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Require an authenticated user and authorize against the entry's business scope.
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use service role for delete, but only after server-side authorization.
  const admin = getAdminClient();
  const { data: entry, error: entryErr } = await admin
    .from("waitlist_entries")
    .select("id, business_id, waitlist_id, token")
    .eq("id", id)
    .maybeSingle();
  if (entryErr) return NextResponse.json({ error: entryErr.message }, { status: 400 });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Owner can always delete; otherwise require active membership in the business.
  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", entry.business_id)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  let allowed = !!owned?.id;
  if (!allowed) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("role, status")
      .eq("business_id", entry.business_id)
      .eq("user_id", user.id)
      .maybeSingle();
    allowed = membership?.status === "active";
  }

  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error: delErr } = await admin.from("waitlist_entries").delete().eq("id", id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });

  // Recalculate ETA after deletion (best-effort)
  if (entry.waitlist_id) {
    try {
      await calculateAndUpdateETA(admin, entry.waitlist_id);
    } catch { }
  }

  // Best-effort broadcast refreshes
  try {
    const wlId = (entry.waitlist_id as string | undefined) || null;
    const entryToken = (entry.token as string | undefined) || null;
    await Promise.all([
      wlId ? broadcastRefresh(`waitlist-entries-${wlId}`) : Promise.resolve(),
      wlId ? broadcastRefresh(`user-wl-${wlId}`) : Promise.resolve(),
      entryToken ? broadcastRefresh(`w-status-${entryToken}`) : Promise.resolve(),
      (async () => {
        if (!wlId) return;
        const { data: wl } = await admin.from("waitlists").select("display_token").eq("id", wlId).maybeSingle();
        const dt = (wl?.display_token as string | null) || null;
        if (dt) await broadcastRefresh(`display-bc-${dt}`);
      })(),
    ]);
  } catch { }

  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["call", "retry_sms", "retry_whatsapp", "archive"]).optional(),
  status: z.enum(["waiting", "notified", "seated", "cancelled", "archived"]).optional(),
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

  // Handle retry actions
  if (action === "retry_sms" || action === "retry_whatsapp") {
    return await handleRetry(id, action, supabase, user.id);
  }

  let payload: Record<string, unknown> = {};
  if (action === "call") {
    payload = { status: "notified", notified_at: new Date().toISOString() };
  } else if (action === "archive") {
    payload = { status: "archived" };
  } else if (status) {
    payload = { status };
  } else {
    return NextResponse.json({ error: "No update specified" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("waitlist_entries")
    .update(payload)
    .eq("id", id)
    .select("id, status, ticket_number, waitlist_id, token")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Recalculate ETA for all entries in this waitlist when status changes (including archive)
  if (data?.waitlist_id && (action === "call" || action === "archive" || status)) {
    const admin = getAdminClient();
    await calculateAndUpdateETA(admin, data.waitlist_id);
  }

  // Best-effort broadcast refreshes
  try {
    const wlId = (data?.waitlist_id as string | undefined) || null;
    const entryToken = (data?.token as string | undefined) || null;
    const admin = getAdminClient();
    await Promise.all([
      wlId ? broadcastRefresh(`waitlist-entries-${wlId}`) : Promise.resolve(),
      wlId ? broadcastRefresh(`user-wl-${wlId}`) : Promise.resolve(),
      entryToken ? broadcastRefresh(`w-status-${entryToken}`) : Promise.resolve(),
      (async () => {
        if (!wlId) return;
        const { data: wl } = await admin.from("waitlists").select("display_token").eq("id", wlId).maybeSingle();
        const dt = (wl?.display_token as string | null) || null;
        if (dt) await broadcastRefresh(`display-bc-${dt}`);
      })(),
    ]);
  } catch { }

  return NextResponse.json({ entry: data });
}

const putSchema = z.object({
  id: z.string().uuid(),
  customer_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  party_size: z.number().nullable().optional(),
  seating_preference: z.string().nullable().optional(),
});

export async function PUT(req: NextRequest) {
  const json = await req.json();
  const parse = putSchema.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updates } = parse.data;

  const { data, error } = await supabase
    .from("waitlist_entries")
    .update(updates)
    .eq("id", id)
    .select("id, customer_name, phone, party_size, seating_preference, waitlist_id, token")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Best-effort broadcast refreshes
  try {
    const wlId = (data?.waitlist_id as string | undefined) || null;
    const entryToken = (data?.token as string | undefined) || null;
    const admin = getAdminClient();
    await Promise.all([
      wlId ? broadcastRefresh(`waitlist-entries-${wlId}`) : Promise.resolve(),
      wlId ? broadcastRefresh(`user-wl-${wlId}`) : Promise.resolve(),
      entryToken ? broadcastRefresh(`w-status-${entryToken}`) : Promise.resolve(),
      (async () => {
        if (!wlId) return;
        const { data: wl } = await admin.from("waitlists").select("display_token").eq("id", wlId).maybeSingle();
        const dt = (wl?.display_token as string | null) || null;
        if (dt) await broadcastRefresh(`display-bc-${dt}`);
      })(),
    ]);
  } catch { }

  return NextResponse.json({ entry: data });
}

// Handle retry logic for failed SMS/WhatsApp messages
async function handleRetry(
  entryId: string,
  action: "retry_sms" | "retry_whatsapp",
  supabase: Awaited<ReturnType<typeof createRouteClient>>,
  userId: string
) {
  // Get entry details
  const { data: entry, error: entryError } = await supabase
    .from("waitlist_entries")
    .select("id, phone, token, ticket_number, sms_status, whatsapp_status, waitlist_id")
    .eq("id", entryId)
    .single();

  if (entryError || !entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const admin = getAdminClient();
  const statusUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/w/${entry.token || "unknown"}`;

  try {
    // Fetch business name for branding (via waitlist -> business)
    let businessName: string | null = null;
    if (entry.waitlist_id) {
      const { data: wl } = await supabase.from("waitlists").select("business_id").eq("id", entry.waitlist_id).maybeSingle();
      const businessId = wl?.business_id as string | undefined;
      if (businessId) {
        const { data: biz } = await supabase.from("businesses").select("name").eq("id", businessId).maybeSingle();
        businessName = (biz?.name as string | undefined) ?? null;
      }
    }

    const built = buildWaitlistNotificationMessage({
      businessName,
      ticketNumber: entry.ticket_number ?? null,
      statusUrl,
    });
    const message = built.text;
    const variables = built.variables;
    const templateParams = built.templateParams;

    if (action === "retry_sms") {
      if (entry.waitlist_id) {
        const { data: wl } = await supabase.from("waitlists").select("business_id").eq("id", entry.waitlist_id).maybeSingle();
        const businessId = (wl?.business_id as string | undefined) || undefined;
        if (businessId) {
          const ctx = await getPlanContext(businessId);
          const usedSms = await countSmsInPeriod(businessId, ctx.window.start, ctx.window.end);
          if (usedSms >= ctx.limits.messagesPerMonth) {
            const msg =
              ctx.planId === "free"
                ? "SMS limit reached for the free plan. Upgrade to send more messages."
                : "Monthly SMS limit reached for your plan";
            return NextResponse.json({ error: msg }, { status: 403 });
          }
        }
      }
      const resp = await sendSms(entry.phone, message, { variables });

      if (resp?.data?.message_id) {
        const messageId = getBulkGateMessageId(resp);
        if (!messageId) {
          return NextResponse.json({ error: "BulkGate did not return a message_id" }, { status: 502 });
        }

        await admin
          .from("waitlist_entries")
          .update({
            sms_message_id: messageId,
            sms_status: 'sent',
            sms_sent_at: new Date().toISOString(),
            sms_error_message: null // Clear previous error
          })
          .eq("id", entryId);

        // Insert new SMS log for retry
        await admin
          .from("notification_logs")
          .insert({
            user_id: userId,
            waitlist_entry_id: entryId,
            message_type: 'sms',
            message_id: messageId,
            phone_number: entry.phone,
            status: 'sent',
            sent_at: new Date().toISOString(),
            message_text: message
          });
      }
    } else if (action === "retry_whatsapp") {
      const resp = await sendWhatsapp(entry.phone, message, { templateParams, variables });

      const actualChannel = getBulkGateChannel(resp) || "whatsapp";
      const messageId = getBulkGateMessageId(resp);
      if (messageId) {
        const nowIso = new Date().toISOString();
        if (actualChannel === "sms") {
          await admin
            .from("waitlist_entries")
            .update({
              sms_message_id: messageId,
              sms_status: "sent",
              sms_sent_at: nowIso,
              sms_error_message: null,
            })
            .eq("id", entryId);
        } else {
          await admin
            .from("waitlist_entries")
            .update({
              whatsapp_message_id: messageId,
              whatsapp_status: "sent",
              whatsapp_sent_at: nowIso,
              whatsapp_error_message: null,
            })
            .eq("id", entryId);
        }

        await admin.from("notification_logs").insert({
          user_id: userId,
          waitlist_entry_id: entryId,
          message_type: actualChannel === "sms" ? "sms" : "whatsapp",
          message_id: messageId,
          phone_number: entry.phone,
          status: "sent",
          sent_at: nowIso,
          message_text: message,
        });
      }
    }

    return NextResponse.json({ success: true, message: `${action === 'retry_sms' ? 'SMS' : 'WhatsApp'} resent successfully` });
  } catch (error) {
    // Update with failed status
    const updateField = action === 'retry_sms' ? 'sms_error_message' : 'whatsapp_error_message';
    const statusField = action === 'retry_sms' ? 'sms_status' : 'whatsapp_status';
    const message = error instanceof Error ? error.message : String(error);

    await admin
      .from("waitlist_entries")
      .update({
        [statusField]: 'failed',
        [updateField]: message
      })
      .eq("id", entryId);

    return NextResponse.json({ error: `Failed to resend ${action === 'retry_sms' ? 'SMS' : 'WhatsApp'}: ${message}` }, { status: 500 });
  }
}