import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

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
    ? "id, customer_name, phone, email, status, queue_position, created_at, ticket_number, token, send_sms, send_whatsapp, party_size, seating_preference, sms_message_id, sms_status, sms_sent_at, sms_delivered_at, sms_error_message, whatsapp_message_id, whatsapp_status, whatsapp_sent_at, whatsapp_delivered_at, whatsapp_error_message"
    : "id, customer_name, status, queue_position, created_at, ticket_number, party_size, seating_preference";

  let q = supabase
    .from("waitlist_entries")
    .select(selectFields)
    .neq("status", "archived") // exclude archived entries
    .neq("status", "cancelled") // exclude cancelled entries
    .not("ticket_number", "is", null); // show only current-cycle entries

  q = q.eq("waitlist_id", waitlistId);

  let { data, error } = await q.order("ticket_number", { ascending: true, nullsFirst: false });

  // If the query fails due to missing columns, retry without them
  if (error && (error.message.includes("send_sms") || error.message.includes("send_whatsapp") || error.message.includes("sms_message_id") || error.message.includes("whatsapp_message_id") || error.message.includes("email") || error.message.includes("column"))) {
    selectFields = isAdmin
      ? "id, customer_name, phone, email, status, queue_position, created_at, ticket_number, token, party_size, seating_preference"
      : "id, customer_name, status, queue_position, created_at, ticket_number, party_size, seating_preference";
    q = supabase
      .from("waitlist_entries")
      .select(selectFields)
      .neq("status", "archived")
      .neq("status", "cancelled")
      .not("ticket_number", "is", null);

    q = q.eq("waitlist_id", waitlistId);

    const retryResult = await q.order("ticket_number", { ascending: true, nullsFirst: false });
    data = retryResult.data;
    error = retryResult.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Add visit counts (based on phone/email match) for any active member.
  // We compute using the admin client but only attach derived fields (visits_count / is_returning),
  // without exposing phone/email to non-admin staff.
  if (isActiveMember && Array.isArray(data) && data.length > 0) {
    try {
      const admin = getAdminClient();
      const seatedCache = new Map<string, number>();
      const anyCache = new Map<string, number>();

      // Fetch phone/email for these entry ids (admin-only), to compute loyalty without leaking PII.
      const ids = (data as any[]).map((e) => e.id).filter(Boolean);
      const { data: piiRows } = await admin
        .from("waitlist_entries")
        .select("id, phone, email")
        .in("id", ids);
      const piiById = new Map<string, { phone: string | null; email: string | null }>();
      (piiRows ?? []).forEach((r: any) => {
        piiById.set(String(r.id), {
          phone: typeof r.phone === "string" && r.phone.trim().length ? r.phone.trim() : null,
          email: typeof r.email === "string" && r.email.trim().length ? r.email.trim() : null,
        });
      });

      const entriesWithCounts = await Promise.all(
        (data as any[]).map(async (e) => {
          const pii = piiById.get(String(e.id));
          const phone = pii?.phone ?? null;
          const email = pii?.email ?? null;
          const key = `${phone || ""}::${email || ""}`;
          if (!phone && !email) return { ...e, visits_count: 0, is_returning: false };
          const cachedSeated = seatedCache.get(key);
          const cachedAny = anyCache.get(key);
          if (typeof cachedSeated === "number" && typeof cachedAny === "number") {
            return { ...e, visits_count: cachedSeated, is_returning: cachedAny > 1 };
          }

          const ors: string[] = [];
          if (phone) ors.push(`phone.eq.${phone}`);
          if (email) ors.push(`email.eq.${email}`);
          const orStr = ors.join(",");

          const [{ count: anyCount }, { count: seatedCount }] = await Promise.all([
            admin
              .from("waitlist_entries")
              .select("id", { count: "exact", head: true })
              .eq("business_id", wl.business_id)
              .or(orStr),
            admin
              .from("waitlist_entries")
              .select("id", { count: "exact", head: true })
              .eq("business_id", wl.business_id)
              .eq("status", "seated")
              .or(orStr),
          ]);

          const visits = seatedCount || 0;
          const anyTotal = anyCount || 0;
          seatedCache.set(key, visits);
          anyCache.set(key, anyTotal);
          return { ...e, visits_count: visits, is_returning: anyTotal > 1 };
        })
      );
      return NextResponse.json({ entries: entriesWithCounts });
    } catch (e) {
      console.error("[waitlist-list] Failed to compute visit counts", e);
      return NextResponse.json({ entries: data ?? [] });
    }
  }

  return NextResponse.json({ entries: data ?? [] });
}
