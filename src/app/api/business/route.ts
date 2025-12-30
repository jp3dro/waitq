import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

type ResolvedBusiness = { businessId: string; canEdit: boolean; role?: string | null };

async function resolveCurrentBusiness(supabase: Awaited<ReturnType<typeof createRouteClient>>, userId: string): Promise<ResolvedBusiness | null> {
  // Prefer owned business
  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const ownedId = (owned?.id as string | undefined) ?? null;
  if (ownedId) return { businessId: ownedId, canEdit: true, role: "owner" };

  // Else: first membership (admin can still edit)
  const { data: member } = await supabase
    .from("memberships")
    .select("business_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const businessId = (member?.business_id as string | undefined) ?? null;
  if (!businessId) return null;

  const role = (member?.role as string | undefined) ?? null;
  const canEdit = role === "admin";
  return { businessId, canEdit, role };
}

export async function GET() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolved = await resolveCurrentBusiness(supabase, user.id);
  if (!resolved) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("businesses")
    .select("id, name, logo_url, accent_color, background_color, country_code, owner_user_id, created_at")
    .eq("id", resolved.businessId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "No business found" }, { status: 404 });

  return NextResponse.json({ business: data, canEdit: resolved.canEdit, role: resolved.role ?? null });
}

const patchSchema = z
  .object({
    name: z.string().min(1).optional(),
    countryCode: z.string().regex(/^[A-Z]{2}$/, { message: "countryCode must be a 2-letter ISO code (e.g. PT)" }).optional(),
    logoUrl: z.string().url().optional().nullable(),
    accentColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, { message: "accentColor must be a HEX color (#RRGGBB)" }).optional(),
    backgroundColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{6})$/, { message: "backgroundColor must be a HEX color (#RRGGBB)" })
      .optional(),
  })
  .strict();

export async function PATCH(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parse = patchSchema.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolved = await resolveCurrentBusiness(supabase, user.id);
  if (!resolved) return NextResponse.json({ error: "No business found" }, { status: 404 });
  if (!resolved.canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const fields: Record<string, unknown> = {};
  if (typeof parse.data.name !== "undefined") fields.name = parse.data.name;
  if (typeof parse.data.countryCode !== "undefined") fields.country_code = parse.data.countryCode;
  if (typeof parse.data.logoUrl !== "undefined") fields.logo_url = parse.data.logoUrl;
  if (typeof parse.data.accentColor !== "undefined") fields.accent_color = parse.data.accentColor;
  if (typeof parse.data.backgroundColor !== "undefined") fields.background_color = parse.data.backgroundColor;

  if (Object.keys(fields).length === 0) return NextResponse.json({ error: "No changes" }, { status: 400 });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("businesses")
    .update(fields)
    .eq("id", resolved.businessId)
    .select("id, name, logo_url, accent_color, background_color, country_code, owner_user_id, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ business: data, canEdit: true, role: resolved.role ?? null });
}


