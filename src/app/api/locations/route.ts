import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createRouteClient();
  const { data, error } = await supabase
    .from("business_locations")
    .select("id, name, phone, address, city, business_id, created_at")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ locations: data ?? [] });
}

const createSchema = z.object({
  businessId: z.string().uuid().optional(),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
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
  const { name, phone, address, city } = parse.data;
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

  const { data, error } = await supabase
    .from("business_locations")
    .insert({ business_id: businessId, name, phone: phone || null, address: address || null, city: city || null })
    .select("id, name, phone, address, city, business_id")
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
  if (Object.keys(payload).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const { data, error } = await supabase
    .from("business_locations")
    .update(payload)
    .eq("id", id)
    .select("id, name, phone, address, city, business_id")
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


