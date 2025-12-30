import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("businesses")
    .select("id, accent_color, background_color, logo_url")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ customization: data });
}

const patchSchema = z.object({
  accentColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, { message: "Invalid HEX color" }).optional(),
  // Background color remains stored, but no longer editable in internal UI
  backgroundColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, { message: "Invalid HEX color" }).optional(),
  coverUrl: z.string().url().optional().nullable(),
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
  if (typeof parse.data.accentColor !== "undefined") fields.accent_color = parse.data.accentColor;
  if (typeof parse.data.backgroundColor !== "undefined") fields.background_color = parse.data.backgroundColor;
  if (typeof parse.data.coverUrl !== "undefined") fields.cover_url = parse.data.coverUrl;
  if (Object.keys(fields).length === 0) return NextResponse.json({ error: "No changes" }, { status: 400 });

  // Identify target business and update by id (PostgREST requires WHERE for UPDATE)
  const admin = getAdminClient();
  const { data: biz, error: bizErr } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (bizErr || !biz) return NextResponse.json({ error: "No business found" }, { status: 400 });

  const { data, error } = await admin
    .from("businesses")
    .update(fields)
    .eq("id", biz.id)
    .select("id, accent_color, background_color, cover_url, logo_url")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ customization: data });
}


