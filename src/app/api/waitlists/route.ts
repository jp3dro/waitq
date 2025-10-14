import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export async function GET() {
  const supabase = await createRouteClient();
  const { data, error } = await supabase
    .from("waitlists")
    .select("id, name, business_id, location_id, display_token, kiosk_enabled, list_type, seating_preferences, created_at, business_locations:location_id(id, name)")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ waitlists: data ?? [] });
}

const postSchema = z.object({
  businessId: z.string().uuid().optional(),
  name: z.string().min(1),
  locationId: z.string().uuid().optional(),
  kioskEnabled: z.boolean().optional().default(false),
  listType: z.enum(["restaurants","barber_shops","beauty_salons","massages","clinics","warehouse_transport","hotels","public_services"]).optional().default("restaurants"),
  seatingPreferences: z.array(z.string()).optional().default([]),
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
  const { name, kioskEnabled, listType, seatingPreferences } = parse.data as { name: string; locationId?: string; kioskEnabled?: boolean; listType?: string; seatingPreferences?: string[] };
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
    .insert({ business_id: businessId, name, location_id: locationId, kiosk_enabled: !!kioskEnabled, list_type: listType, seating_preferences: seatingPreferences || [] })
    .select("id, name, business_id, location_id, display_token, kiosk_enabled, list_type, seating_preferences")
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

  const { error } = await supabase.from("waitlists").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// Clear a waitlist: delete all entries
export async function PATCH(req: NextRequest) {
  const json = await req.json();
  const { id, action } = json as { id?: string; action?: string };
  if (!id || action !== "clear") return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Delete all entries for this waitlist
  const admin = getAdminClient();
  const { error: delErr } = await admin
    .from("waitlist_entries")
    .delete()
    .eq("waitlist_id", id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  locationId: z.string().uuid().optional(),
  kioskEnabled: z.boolean().optional(),
  listType: z.enum(["restaurants","barber_shops","beauty_salons","massages","clinics","warehouse_transport","hotels","public_services"]).optional(),
  seatingPreferences: z.array(z.string()).optional(),
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

  const { id, name, locationId, kioskEnabled, listType, seatingPreferences } = parse.data;
  const payload: Record<string, unknown> = {};
  if (typeof name === "string") payload.name = name;
  if (typeof locationId === "string") payload.location_id = locationId;
  if (typeof kioskEnabled === "boolean") payload.kiosk_enabled = kioskEnabled;
  if (typeof listType === "string") payload.list_type = listType;
  if (Array.isArray(seatingPreferences)) payload.seating_preferences = seatingPreferences;
  if (Object.keys(payload).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const { data, error } = await supabase
    .from("waitlists")
    .update(payload)
    .eq("id", id)
    .select("id, name, business_id, location_id, display_token, kiosk_enabled, list_type, seating_preferences")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ waitlist: data });
}


