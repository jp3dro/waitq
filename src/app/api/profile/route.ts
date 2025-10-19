import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, logo_url, country_code")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ business: data });
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().url().optional().nullable(),
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

  const fields: Record<string, unknown> = {};
  if (typeof parse.data.name !== "undefined") fields.name = parse.data.name;
  if (typeof parse.data.logoUrl !== "undefined") fields.logo_url = parse.data.logoUrl;
  if (Object.keys(fields).length === 0) return NextResponse.json({ error: "No changes" }, { status: 400 });

  const { data, error } = await supabase
    .from("businesses")
    .update(fields)
    .order("created_at", { ascending: true })
    .limit(1)
    .select("id, name, logo_url, country_code")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ business: data });
}


