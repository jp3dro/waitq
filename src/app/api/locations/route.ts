import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteClient } from "@/lib/supabase/server";
import { countLocations, getPlanContext } from "@/lib/plan-limits";

const defaultRegularHours = {
  sun: [{ start: "10:00", end: "23:00" }],
  mon: [{ start: "10:00", end: "23:00" }],
  tue: [{ start: "10:00", end: "23:00" }],
  wed: [{ start: "10:00", end: "23:00" }],
  thu: [{ start: "10:00", end: "23:00" }],
  fri: [{ start: "10:00", end: "23:00" }],
  sat: [{ start: "10:00", end: "23:00" }],
} as const;

export async function GET() {
  const supabase = await createRouteClient();
  const { data, error } = await supabase
    .from("business_locations")
    .select("id, name, phone, address, city, seating_capacity, business_id, regular_hours, timezone, created_at")
    .order("created_at", { ascending: true });
  if (error && error.message.includes("column")) {
    const retry = await supabase
      .from("business_locations")
      .select("id, name, phone, address, city, seating_capacity, business_id, created_at")
      .order("created_at", { ascending: true });
    if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 400 });
    return NextResponse.json({ locations: retry.data ?? [] });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ locations: data ?? [] });
}

const createSchema = z.object({
  businessId: z.string().uuid().optional(),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  seatingCapacity: z.number().int().positive().optional().nullable(),
  regularHours: z.record(z.string(), z.array(z.object({ start: z.string(), end: z.string() }))).optional(),
  timezone: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parse = createSchema.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let { businessId } = parse.data;
  const { name, phone, address, city, seatingCapacity, regularHours, timezone } = parse.data;
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

  const { limits } = await getPlanContext(businessId);
  const usedLocations = await countLocations(businessId);
  if (usedLocations >= limits.locations) {
    return NextResponse.json({ error: "Location limit reached for your plan" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("business_locations")
    .insert({
      business_id: businessId,
      name,
      phone: phone || null,
      address: address || null,
      city: city || null,
      seating_capacity: typeof seatingCapacity === "number" ? seatingCapacity : null,
      regular_hours: regularHours || defaultRegularHours,
      timezone: timezone || "UTC",
    })
    .select("id, name, phone, address, city, seating_capacity, business_id, regular_hours, timezone")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ location: data }, { status: 201 });
}

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  seatingCapacity: z.number().int().positive().optional().nullable(),
  regularHours: z.record(z.string(), z.array(z.object({ start: z.string(), end: z.string() }))).optional(),
  timezone: z.string().min(1).optional(),
});

export async function PATCH(req: NextRequest) {
  const json = await req.json();
  const parse = updateSchema.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...rest } = parse.data;
  const payload: Record<string, unknown> = {};
  if (typeof rest.name === "string") payload.name = rest.name;
  if (typeof rest.phone !== "undefined") payload.phone = rest.phone;
  if (typeof rest.address !== "undefined") payload.address = rest.address;
  if (typeof rest.city !== "undefined") payload.city = rest.city;
  if (typeof rest.seatingCapacity !== "undefined") payload.seating_capacity = rest.seatingCapacity;
  if (typeof rest.regularHours !== "undefined") payload.regular_hours = rest.regularHours;
  if (typeof rest.timezone !== "undefined") payload.timezone = rest.timezone;
  if (Object.keys(payload).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const { data, error } = await supabase
    .from("business_locations")
    .update(payload)
    .eq("id", id)
    .select("id, name, phone, address, city, seating_capacity, business_id, regular_hours, timezone")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ location: data });
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

  // Pre-check: prevent deleting if any waitlists reference this location
  const { count, error: cntErr } = await supabase
    .from("waitlists")
    .select("id", { count: "exact", head: true })
    .eq("location_id", id);
  if (cntErr) return NextResponse.json({ error: cntErr.message }, { status: 400 });
  if ((count || 0) > 0) {
    return NextResponse.json({ error: "Reassign or delete waitlists using this location before deleting it" }, { status: 400 });
  }

  const { error } = await supabase.from("business_locations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}


