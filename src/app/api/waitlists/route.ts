import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { getLocationOpenState, type RegularHours } from "@/lib/location-hours";
import { broadcastRefresh } from "@/lib/realtime-broadcast";
import { resolveCurrentBusinessId } from "@/lib/current-business";

export async function GET() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await resolveCurrentBusinessId(supabase as any, user.id);
  if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const admin = getAdminClient();
  const selectFields = "id, name, business_id, location_id, display_token, kiosk_enabled, kiosk_qr_enabled, display_enabled, display_show_name, display_show_qr, list_type, ask_name, ask_phone, ask_email, average_wait_minutes, created_at, business_locations:location_id(id, name, regular_hours, timezone, seating_preferences)";
  const { data, error } = await admin
    .from("waitlists")
    .select(selectFields)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (error && (error.message.toLowerCase().includes("display_enabled") || error.message.toLowerCase().includes("display_show_name") || error.message.toLowerCase().includes("display_show_qr"))) {
    const retry = await admin
      .from("waitlists")
      .select(
        "id, name, business_id, location_id, display_token, kiosk_enabled, list_type, ask_name, ask_phone, ask_email, created_at, business_locations:location_id(id, name, regular_hours, timezone, seating_preferences)"
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });
    if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 400 });
    const waitlists = (retry.data ?? []).map((w) => {
      const loc = (w as unknown as { business_locations?: { regular_hours?: unknown; timezone?: unknown; seating_preferences?: unknown } | null }).business_locations;
      const openState = getLocationOpenState({
        regularHours: (loc?.regular_hours as RegularHours | null) || null,
        timezone: (typeof loc?.timezone === "string" ? (loc.timezone as string) : null) || null,
      });
      return {
        ...w,
        display_enabled: true,
        display_show_name: false,
        display_show_qr: false,
        seating_preferences: Array.isArray(loc?.seating_preferences) ? loc.seating_preferences : [],
        location_is_open: openState.isOpen,
        location_status_reason: openState.reason,
      };
    });
    return NextResponse.json({ waitlists });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const waitlists = (data ?? []).map((w) => {
    const loc = (w as unknown as { business_locations?: { regular_hours?: unknown; timezone?: unknown; seating_preferences?: unknown } | null }).business_locations;
    const openState = getLocationOpenState({
      regularHours: (loc?.regular_hours as RegularHours | null) || null,
      timezone: (typeof loc?.timezone === "string" ? (loc.timezone as string) : null) || null,
    });
    return {
      ...w,
      seating_preferences: Array.isArray(loc?.seating_preferences) ? loc.seating_preferences : [],
      location_is_open: openState.isOpen,
      location_status_reason: openState.reason,
    };
  });

  return NextResponse.json({ waitlists });
}

const postSchema = z.object({
  businessId: z.string().uuid().optional(),
  name: z.string().min(1).max(30, "Name must be 30 characters or fewer"),
  locationId: z.string().uuid().optional(),
  kioskEnabled: z.boolean().optional().default(true),
  kioskQrEnabled: z.boolean().optional().default(false),
  displayEnabled: z.boolean().optional(),
  displayShowName: z.boolean().optional(),
  displayShowQr: z.boolean().optional(),
  seatingPreferences: z.array(z.string()).optional().default([]),
  askName: z.boolean().optional().default(true),
  askPhone: z.boolean().optional().default(true),
  askEmail: z.boolean().optional().default(false),
  averageWaitMinutes: z.number().int().positive().optional(),
  listType: z.enum(["eat_in", "take_out"]).optional().default("eat_in"),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parse = postSchema.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let businessId = parse.data.businessId;
  const { name, kioskEnabled, kioskQrEnabled, displayEnabled, displayShowName, displayShowQr, askName, askPhone, askEmail, averageWaitMinutes, listType } = parse.data as {
    name: string;
    locationId?: string;
    kioskEnabled?: boolean;
    kioskQrEnabled?: boolean;
    displayEnabled?: boolean;
    displayShowName?: boolean;
    displayShowQr?: boolean;
    askName?: boolean;
    askPhone?: boolean;
    askEmail?: boolean;
    averageWaitMinutes?: number;
    listType?: "eat_in" | "take_out";
  };
  let { locationId } = parse.data as { name: string; locationId?: string };
  if (!businessId) {
    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    if (bizErr || !biz) return NextResponse.json({ error: "No business found for user" }, { status: 400 });
    businessId = biz.id as string;
  }
  if (!locationId) {
    const { data: loc } = await supabase
      .from("business_locations")
      .select("id")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    locationId = loc?.id as string | undefined;
  }
  const { data, error } = await supabase
    .from("waitlists")
    .insert({
      business_id: businessId,
      name,
      location_id: locationId,
      kiosk_enabled: !!kioskEnabled,
      kiosk_qr_enabled: !!kioskQrEnabled,
      display_enabled: displayEnabled !== false,
      display_show_name: displayShowName !== false,
      display_show_qr: displayShowQr === true,
      list_type: listType || "eat_in",
      ask_name: askName !== false,
      ask_phone: askPhone !== false,
      ask_email: askEmail === true,
      average_wait_minutes: averageWaitMinutes || null,
    })
    .select("id, name, business_id, location_id, display_token, kiosk_enabled, kiosk_qr_enabled, display_enabled, display_show_name, display_show_qr, list_type, ask_name, ask_phone, ask_email, average_wait_minutes")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ waitlist: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if this is the last list for the business
  // First, get the business_id of the list to be deleted
  const { data: listToDelete, error: listError } = await supabase
    .from("waitlists")
    .select("business_id")
    .eq("id", id)
    .single();

  if (listError || !listToDelete) return NextResponse.json({ error: "List not found" }, { status: 404 });

  // Count lists for this business
  const { count } = await supabase
    .from("waitlists")
    .select("*", { count: "exact", head: true })
    .eq("business_id", listToDelete.business_id);

  if ((count || 0) <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the only remaining list. You must have at least one list." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("waitlists").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// Clear a waitlist: archive all waiting entries (keep for analytics)
export async function PATCH(req: NextRequest) {
  const json = await req.json();
  const { id, action } = json as { id?: string; action?: string };
  if (!id || action !== "clear") return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Archive all waiting, notified, and seated entries for this waitlist
  // Waiting entries are treated as called-now no-shows: stamp notified_at
  const admin = getAdminClient();
  const nowIso = new Date().toISOString();

  const { error: updateWaitingErr } = await admin
    .from("waitlist_entries")
    .update({ status: "archived", notified_at: nowIso })
    .eq("waitlist_id", id)
    .eq("status", "waiting");
  if (updateWaitingErr) return NextResponse.json({ error: updateWaitingErr.message }, { status: 400 });

  const { error: updateNotifiedErr } = await admin
    .from("waitlist_entries")
    .update({ status: "archived" })
    .eq("waitlist_id", id)
    .eq("status", "notified");
  if (updateNotifiedErr) return NextResponse.json({ error: updateNotifiedErr.message }, { status: 400 });

  const { error: updateSeatedErr } = await admin
    .from("waitlist_entries")
    .update({ status: "archived" })
    .eq("waitlist_id", id)
    .eq("status", "seated");
  if (updateSeatedErr) return NextResponse.json({ error: updateSeatedErr.message }, { status: 400 });

  // Reset ticket numbers by nullifying ticket_number in all entries for this waitlist
  const { error: resetErr } = await admin
    .from("waitlist_entries")
    .update({ ticket_number: null })
    .eq("waitlist_id", id);
  if (resetErr) return NextResponse.json({ error: resetErr.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(30, "Name must be 30 characters or fewer").optional(),
  locationId: z.string().uuid().optional(),
  kioskEnabled: z.boolean().optional(),
  kioskQrEnabled: z.boolean().optional(),
  displayEnabled: z.boolean().optional(),
  displayShowName: z.boolean().optional(),
  displayShowQr: z.boolean().optional(),
  seatingPreferences: z.array(z.string()).optional(),
  askName: z.boolean().optional(),
  askPhone: z.boolean().optional(),
  askEmail: z.boolean().optional(),
  averageWaitMinutes: z.number().int().positive().nullable().optional(),
  listType: z.enum(["eat_in", "take_out"]).optional(),
});

export async function PUT(req: NextRequest) {
  const json = await req.json();
  const parse = patchSchema.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await resolveCurrentBusinessId(supabase as any, user.id);
  if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const { id, name, locationId, kioskEnabled, kioskQrEnabled, displayEnabled, displayShowName, displayShowQr, askName, askPhone, askEmail, averageWaitMinutes, listType } = parse.data;
  const payload: Record<string, unknown> = {};
  if (typeof name === "string") payload.name = name;
  if (typeof locationId === "string") payload.location_id = locationId;
  if (typeof kioskEnabled === "boolean") payload.kiosk_enabled = kioskEnabled;
  if (typeof kioskQrEnabled === "boolean") payload.kiosk_qr_enabled = kioskQrEnabled;
  if (typeof displayEnabled === "boolean") payload.display_enabled = displayEnabled;
  if (typeof displayShowName === "boolean") payload.display_show_name = displayShowName;
  if (typeof displayShowQr === "boolean") payload.display_show_qr = displayShowQr;
  if (typeof askName === "boolean") payload.ask_name = askName;
  if (typeof askPhone === "boolean") payload.ask_phone = askPhone;
  if (typeof askEmail === "boolean") payload.ask_email = askEmail;
  if (averageWaitMinutes !== undefined) payload.average_wait_minutes = averageWaitMinutes;
  if (typeof listType === "string") payload.list_type = listType;

  if (Object.keys(payload).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  // Use admin client for staff members; enforce business scoping ourselves.
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("waitlists")
    .update(payload)
    .eq("id", id)
    .eq("business_id", businessId)
    .select("id, name, business_id, location_id, display_token, kiosk_enabled, kiosk_qr_enabled, display_enabled, display_show_name, display_show_qr, list_type, ask_name, ask_phone, ask_email, average_wait_minutes")
    .maybeSingle();
  if (error && (error.message.toLowerCase().includes("display_enabled") || error.message.toLowerCase().includes("display_show_name") || error.message.toLowerCase().includes("display_show_qr"))) {
    return NextResponse.json({ error: "Public display settings are not available in this project. Add the display_* columns first." }, { status: 400 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "List not found or access denied" }, { status: 404 });

  // Best-effort: notify any public displays for this waitlist so they refetch settings immediately.
  try {
    const token = (data as unknown as { display_token?: string | null }).display_token || null;
    if (token) {
      await broadcastRefresh(`display-bc-${token}`);
    }
  } catch { }

  return NextResponse.json({ waitlist: data });
}

