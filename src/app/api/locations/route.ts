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

function isMissingColumnError(errMsg: string, column: string) {
  const m = errMsg.toLowerCase();
  const c = column.toLowerCase();
  return (
    m.includes(`could not find the '${c}' column`) ||
    m.includes(`could not find the "${c}" column`) ||
    m.includes(`column ${c} does not exist`) ||
    m.includes(`column "${c}" does not exist`) ||
    m.includes("schema cache") && m.includes(c)
  );
}

async function resolveCurrentBusiness(supabase: Awaited<ReturnType<typeof createRouteClient>>, userId: string): Promise<string | null> {
  // Prefer owned business
  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const ownedId = (owned?.id as string | undefined) ?? null;
  if (ownedId) return ownedId;

  // Else: first membership business
  const { data: member } = await supabase
    .from("memberships")
    .select("business_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (member?.business_id as string | undefined) ?? null;
}

export async function GET() {
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await resolveCurrentBusiness(supabase, user.id);
  if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const { data, error } = await supabase
    .from("business_locations")
    .select("id, name, phone, address, city, seating_capacity, business_id, regular_hours, timezone, country_code, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (error && (error.message.includes("column") || error.message.includes("schema cache"))) {
    const retry = await supabase
      .from("business_locations")
      .select("id, name, phone, address, city, seating_capacity, business_id, regular_hours, timezone, created_at")
      .eq("business_id", businessId)
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
  countryCode: z.string().min(2).max(2).optional(),
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

  const { name, phone, address, city, seatingCapacity, regularHours, timezone, countryCode } = parse.data;
  
  // Always resolve the correct business for this user (owned first, else membership)
  const businessId = await resolveCurrentBusiness(supabase, user.id);
  if (!businessId) return NextResponse.json({ error: "No business found for user" }, { status: 400 });

  // Enforce location limits for ALL tiers (Free = 1, Base = 5, Premium = 100)
  const { limits } = await getPlanContext(businessId);
  const usedLocations = await countLocations(businessId);
  if (usedLocations >= limits.locations) {
    return NextResponse.json({ error: "Location limit reached for your plan" }, { status: 403 });
  }

  // Some deployments may not have `country_code` on `business_locations` yet (Supabase schema cache).
  // Try inserting with it; if missing, retry without the column.
  const insertBase = {
    business_id: businessId,
    name,
    phone: phone || null,
    address: address || null,
    city: city || null,
    seating_capacity: typeof seatingCapacity === "number" ? seatingCapacity : null,
    regular_hours: regularHours || defaultRegularHours,
    timezone: timezone || "UTC",
  } as Record<string, unknown>;

  const attempt1 = await supabase
    .from("business_locations")
    .insert({ ...insertBase, country_code: countryCode || null })
    .select("id, name, phone, address, city, seating_capacity, business_id, regular_hours, timezone, country_code")
    .single();

  if (attempt1.error && isMissingColumnError(attempt1.error.message, "country_code")) {
    const attempt2 = await supabase
      .from("business_locations")
      .insert(insertBase)
      .select("id, name, phone, address, city, seating_capacity, business_id, regular_hours, timezone")
      .single();
    if (attempt2.error) return NextResponse.json({ error: attempt2.error.message }, { status: 400 });
    return NextResponse.json({ location: attempt2.data }, { status: 201 });
  }

  if (attempt1.error) return NextResponse.json({ error: attempt1.error.message }, { status: 400 });
  return NextResponse.json({ location: attempt1.data }, { status: 201 });
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
  countryCode: z.string().min(2).max(2).optional(),
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

  const businessId = await resolveCurrentBusiness(supabase, user.id);
  if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const { id, ...rest } = parse.data;
  
  // Ensure the location belongs to the user's business
  const { data: existing } = await supabase
    .from("business_locations")
    .select("business_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing || existing.business_id !== businessId) {
    return NextResponse.json({ error: "Location not found or access denied" }, { status: 404 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof rest.name === "string") payload.name = rest.name;
  if (typeof rest.phone !== "undefined") payload.phone = rest.phone;
  if (typeof rest.address !== "undefined") payload.address = rest.address;
  if (typeof rest.city !== "undefined") payload.city = rest.city;
  if (typeof rest.seatingCapacity !== "undefined") payload.seating_capacity = rest.seatingCapacity;
  if (typeof rest.regularHours !== "undefined") payload.regular_hours = rest.regularHours;
  if (typeof rest.timezone !== "undefined") payload.timezone = rest.timezone;
  if (typeof rest.countryCode !== "undefined") payload.country_code = rest.countryCode;
  if (Object.keys(payload).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const attempt1 = await supabase
    .from("business_locations")
    .update(payload)
    .eq("id", id)
    .select("id, name, phone, address, city, seating_capacity, business_id, regular_hours, timezone, country_code")
    .single();
  if (attempt1.error && isMissingColumnError(attempt1.error.message, "country_code")) {
    // Retry without the unsupported column
    const payload2 = { ...payload };
    delete (payload2 as any).country_code;
    if (Object.keys(payload2).length === 0) {
      return NextResponse.json(
        { error: "This project does not support per-location country yet." },
        { status: 400 }
      );
    }
    const attempt2 = await supabase
      .from("business_locations")
      .update(payload2)
      .eq("id", id)
      .select("id, name, phone, address, city, seating_capacity, business_id, regular_hours, timezone")
      .single();
    if (attempt2.error) return NextResponse.json({ error: attempt2.error.message }, { status: 400 });
    return NextResponse.json({ location: attempt2.data });
  }

  if (attempt1.error) return NextResponse.json({ error: attempt1.error.message }, { status: 400 });
  return NextResponse.json({ location: attempt1.data });
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

  const businessId = await resolveCurrentBusiness(supabase, user.id);
  if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 404 });

  // Ensure the location belongs to the user's business
  const { data: existing } = await supabase
    .from("business_locations")
    .select("business_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing || existing.business_id !== businessId) {
    return NextResponse.json({ error: "Location not found or access denied" }, { status: 404 });
  }

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


