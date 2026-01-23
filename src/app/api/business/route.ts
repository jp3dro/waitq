import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { resolveCurrentBusinessContext } from "@/lib/current-business";

export async function GET() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolved = await resolveCurrentBusinessContext(supabase as any, user.id);
  if (!resolved) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("businesses")
    .select(
      "id, name, logo_url, accent_color, background_color, country_code, vat_id, time_format, owner_user_id, created_at, website_url, instagram_url, facebook_url, google_maps_url, menu_url"
    )
    .eq("id", resolved.businessId)
    .maybeSingle();

  if (error && error.message.includes("column")) {
    const retry = await admin
      .from("businesses")
      .select(
        "id, name, logo_url, accent_color, background_color, country_code, owner_user_id, created_at, website_url, instagram_url, facebook_url, google_maps_url, menu_url"
      )
      .eq("id", resolved.businessId)
      .maybeSingle();
    if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 400 });
    return NextResponse.json({ business: retry.data, canEdit: resolved.canEdit, role: resolved.role ?? null });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "No business found" }, { status: 404 });

  return NextResponse.json({ business: data, canEdit: resolved.canEdit, role: resolved.role ?? null });
}

const patchSchema = z
  .object({
    name: z.string().min(1).optional(),
    countryCode: z.string().regex(/^[A-Z]{2}$/, { message: "countryCode must be a 2-letter ISO code (e.g. PT)" }).optional(),
    vatId: z.string().optional().nullable(),
    vatIdValid: z.boolean().optional().nullable(),
    vatIdValidatedAt: z.string().datetime().optional().nullable(),
    vatIdName: z.string().optional().nullable(),
    vatIdAddress: z.string().optional().nullable(),
    timeFormat: z.enum(["12h", "24h"]).optional(),
    logoUrl: z.string().url().optional().nullable(),
    accentColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, { message: "accentColor must be a HEX color (#RRGGBB)" }).optional(),
    backgroundColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{6})$/, { message: "backgroundColor must be a HEX color (#RRGGBB)" })
      .optional(),
    websiteUrl: z.string().url().optional().nullable(),
    instagramUrl: z.string().url().optional().nullable(),
    facebookUrl: z.string().url().optional().nullable(),
    googleMapsUrl: z.string().url().optional().nullable(),
    menuUrl: z.string().url().optional().nullable(),
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

  const resolved = await resolveCurrentBusinessContext(supabase as any, user.id);
  if (!resolved) return NextResponse.json({ error: "No business found" }, { status: 404 });
  if (!resolved.canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const asNullIfEmpty = (v: string | null | undefined) => {
    if (v === null) return null;
    if (typeof v === "undefined") return undefined;
    const t = v.trim();
    return t.length === 0 ? null : t;
  };

  const fields: Record<string, unknown> = {};
  if (typeof parse.data.name !== "undefined") fields.name = parse.data.name;
  if (typeof parse.data.countryCode !== "undefined") fields.country_code = parse.data.countryCode;
  if (typeof parse.data.vatId !== "undefined") fields.vat_id = asNullIfEmpty(parse.data.vatId);
  if (typeof parse.data.vatIdValid !== "undefined") fields.vat_id_valid = parse.data.vatIdValid;
  if (typeof parse.data.vatIdValidatedAt !== "undefined") fields.vat_id_validated_at = parse.data.vatIdValidatedAt;
  if (typeof parse.data.vatIdName !== "undefined") fields.vat_id_name = asNullIfEmpty(parse.data.vatIdName);
  if (typeof parse.data.vatIdAddress !== "undefined") fields.vat_id_address = asNullIfEmpty(parse.data.vatIdAddress);
  if (typeof parse.data.timeFormat !== "undefined") fields.time_format = parse.data.timeFormat;
  if (typeof parse.data.logoUrl !== "undefined") fields.logo_url = parse.data.logoUrl;
  if (typeof parse.data.accentColor !== "undefined") fields.accent_color = parse.data.accentColor;
  if (typeof parse.data.backgroundColor !== "undefined") fields.background_color = parse.data.backgroundColor;
  if (typeof parse.data.websiteUrl !== "undefined") fields.website_url = asNullIfEmpty(parse.data.websiteUrl);
  if (typeof parse.data.instagramUrl !== "undefined") fields.instagram_url = asNullIfEmpty(parse.data.instagramUrl);
  if (typeof parse.data.facebookUrl !== "undefined") fields.facebook_url = asNullIfEmpty(parse.data.facebookUrl);
  if (typeof parse.data.googleMapsUrl !== "undefined") fields.google_maps_url = asNullIfEmpty(parse.data.googleMapsUrl);
  if (typeof parse.data.menuUrl !== "undefined") fields.menu_url = asNullIfEmpty(parse.data.menuUrl);

  if (Object.keys(fields).length === 0) return NextResponse.json({ error: "No changes" }, { status: 400 });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("businesses")
    .update(fields)
    .eq("id", resolved.businessId)
    .select(
      "id, name, logo_url, accent_color, background_color, country_code, vat_id, time_format, owner_user_id, created_at, website_url, instagram_url, facebook_url, google_maps_url, menu_url"
    )
    .single();

  // If VAT columns are missing in the schema cache, retry without them (so other fields can still save).
  if (
    error &&
    (error.message.includes("vat_id") ||
      error.message.includes("vatId") ||
      error.message.includes("vat_id_valid") ||
      error.message.includes("vat_id_validated_at") ||
      error.message.includes("vat_id_name") ||
      error.message.includes("vat_id_address"))
  ) {
    const rest = { ...(fields as Record<string, unknown>) };
    delete rest.vat_id;
    delete rest.vat_id_valid;
    delete rest.vat_id_validated_at;
    delete rest.vat_id_name;
    delete rest.vat_id_address;
    const retry = await admin
      .from("businesses")
      .update(rest)
      .eq("id", resolved.businessId)
      .select(
        "id, name, logo_url, accent_color, background_color, country_code, owner_user_id, created_at, website_url, instagram_url, facebook_url, google_maps_url, menu_url"
      )
      .single();
    if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 400 });
    return NextResponse.json({ business: retry.data, canEdit: true, role: resolved.role ?? null });
  }

  if (error && error.message.includes("column")) {
    const retry = await admin
      .from("businesses")
      .update(fields)
      .eq("id", resolved.businessId)
      .select(
        "id, name, logo_url, accent_color, background_color, country_code, owner_user_id, created_at, website_url, instagram_url, facebook_url, google_maps_url, menu_url"
      )
      .single();
    if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 400 });
    return NextResponse.json({ business: retry.data, canEdit: true, role: resolved.role ?? null });
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ business: data, canEdit: true, role: resolved.role ?? null });
}


