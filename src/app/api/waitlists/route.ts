import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { getLocationOpenState, type RegularHours } from "@/lib/location-hours";

export async function GET() {
  const supabase = await createRouteClient();
  const selectFields = "id, name, business_id, location_id, display_token, kiosk_enabled, display_enabled, display_show_name, display_show_qr, list_type, seating_preferences, ask_name, ask_phone, ask_email, created_at, business_locations:location_id(id, name, regular_hours, timezone)";
  const { data, error } = await supabase
    .from("waitlists")
    .select(selectFields)
    .order("created_at", { ascending: true });
  if (error && (error.message.toLowerCase().includes("display_enabled") || error.message.toLowerCase().includes("display_show_name") || error.message.toLowerCase().includes("display_show_qr"))) {
    const retry = await supabase
      .from("waitlists")
      .select(
        "id, name, business_id, location_id, display_token, kiosk_enabled, list_type, seating_preferences, ask_name, ask_phone, ask_email, created_at, business_locations:location_id(id, name, regular_hours, timezone)"
      )
      .order("created_at", { ascending: true });
    if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 400 });
    const waitlists = (retry.data ?? []).map((w) => {
      const loc = (w as unknown as { business_locations?: { regular_hours?: unknown; timezone?: unknown } | null }).business_locations;
      const openState = getLocationOpenState({
        regularHours: (loc?.regular_hours as RegularHours | null) || null,
        timezone: (typeof loc?.timezone === "string" ? (loc.timezone as string) : null) || null,
      });
      return {
        ...w,
        display_enabled: true,
        display_show_name: false,
        display_show_qr: false,
        location_is_open: openState.isOpen,
        location_status_reason: openState.reason,
      };
    });
    return NextResponse.json({ waitlists });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const waitlists = (data ?? []).map((w) => {
    const loc = (w as unknown as { business_locations?: { regular_hours?: unknown; timezone?: unknown } | null }).business_locations;
    const openState = getLocationOpenState({
      regularHours: (loc?.regular_hours as RegularHours | null) || null,
      timezone: (typeof loc?.timezone === "string" ? (loc.timezone as string) : null) || null,
    });
    return {
      ...w,
      location_is_open: openState.isOpen,
      location_status_reason: openState.reason,
    };
  });

  return NextResponse.json({ waitlists });
}

const postSchema = z.object({
  businessId: z.string().uuid().optional(),
  name: z.string().min(1),
  locationId: z.string().uuid().optional(),
  kioskEnabled: z.boolean().optional().default(false),
  displayEnabled: z.boolean().optional(),
  displayShowName: z.boolean().optional(),
  displayShowQr: z.boolean().optional(),
  seatingPreferences: z.array(z.string()).optional().default([]),
  askName: z.boolean().optional().default(true),
  askPhone: z.boolean().optional().default(true),
  askEmail: z.boolean().optional().default(false),
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
  const { name, kioskEnabled, displayEnabled, displayShowName, displayShowQr, seatingPreferences, askName, askPhone, askEmail } = parse.data as {
    name: string;
    locationId?: string;
    kioskEnabled?: boolean;
    displayEnabled?: boolean;
    displayShowName?: boolean;
    displayShowQr?: boolean;
    seatingPreferences?: string[];
    askName?: boolean;
    askPhone?: boolean;
    askEmail?: boolean;
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
      display_enabled: displayEnabled !== false,
      display_show_name: displayShowName !== false,
      display_show_qr: displayShowQr === true,
      list_type: "restaurants",
      seating_preferences: seatingPreferences || [],
      ask_name: askName !== false,
      ask_phone: askPhone !== false,
      ask_email: askEmail === true,
    })
    .select("id, name, business_id, location_id, display_token, kiosk_enabled, display_enabled, display_show_name, display_show_qr, list_type, seating_preferences, ask_name, ask_phone, ask_email")
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
  name: z.string().min(1).optional(),
  locationId: z.string().uuid().optional(),
  kioskEnabled: z.boolean().optional(),
  displayEnabled: z.boolean().optional(),
  displayShowName: z.boolean().optional(),
  displayShowQr: z.boolean().optional(),
  seatingPreferences: z.array(z.string()).optional(),
  askName: z.boolean().optional(),
  askPhone: z.boolean().optional(),
  askEmail: z.boolean().optional(),
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

  const { id, name, locationId, kioskEnabled, displayEnabled, displayShowName, displayShowQr, seatingPreferences, askName, askPhone, askEmail } = parse.data;
  const payload: Record<string, unknown> = {};
  if (typeof name === "string") payload.name = name;
  if (typeof locationId === "string") payload.location_id = locationId;
  if (typeof kioskEnabled === "boolean") payload.kiosk_enabled = kioskEnabled;
  if (typeof displayEnabled === "boolean") payload.display_enabled = displayEnabled;
  if (typeof displayShowName === "boolean") payload.display_show_name = displayShowName;
  if (typeof displayShowQr === "boolean") payload.display_show_qr = displayShowQr;
  if (Array.isArray(seatingPreferences)) payload.seating_preferences = seatingPreferences;
  if (typeof askName === "boolean") payload.ask_name = askName;
  if (typeof askPhone === "boolean") payload.ask_phone = askPhone;
  if (typeof askEmail === "boolean") payload.ask_email = askEmail;

  if (Object.keys(payload).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const { data, error } = await supabase
    .from("waitlists")
    .update(payload)
    .eq("id", id)
    .select("id, name, business_id, location_id, display_token, kiosk_enabled, display_enabled, display_show_name, display_show_qr, list_type, seating_preferences, ask_name, ask_phone, ask_email")
    .single();
  if (error && (error.message.toLowerCase().includes("display_enabled") || error.message.toLowerCase().includes("display_show_name") || error.message.toLowerCase().includes("display_show_qr"))) {
    return NextResponse.json({ error: "Public display settings are not available in this project. Add the display_* columns first." }, { status: 400 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ waitlist: data });
}

