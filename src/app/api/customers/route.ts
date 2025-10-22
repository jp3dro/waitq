import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

// Normalize to digits-only in SQL: regexp_replace(phone, '\\D', '', 'g')

const patchSchema = z.object({
  phoneKey: z.string().min(1),
  name: z.string().nullable().optional(),
  newPhone: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const json = await req.json();
  const parse = patchSchema.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const { phoneKey, name, newPhone } = parse.data;
  if (typeof name === "undefined" && typeof newPhone === "undefined") {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Determine current business scope (RLS ensures only accessible business is returned)
  const { data: biz } = await supabase
    .from("businesses")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!biz?.id) return NextResponse.json({ error: "No business found" }, { status: 400 });

  const admin = getAdminClient();
  const updates: Record<string, unknown> = {};
  if (typeof name !== "undefined") updates.customer_name = name;
  if (typeof newPhone !== "undefined") updates.phone = newPhone;

  // Update all waitlist entries for this business and normalized phone
  const { data: updated, error } = await admin
    .from("waitlist_entries")
    .update(updates)
    .eq("business_id", biz.id)
    .filter("regexp_replace(phone, \\D, '', 'g')", "eq", phoneKey)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ updated: updated?.length ?? 0 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phoneKey = searchParams.get("phoneKey");
  if (!phoneKey) return NextResponse.json({ error: "Missing phoneKey" }, { status: 400 });

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: biz } = await supabase
    .from("businesses")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!biz?.id) return NextResponse.json({ error: "No business found" }, { status: 400 });

  const admin = getAdminClient();
  const { error } = await admin
    .from("waitlist_entries")
    .delete()
    .eq("business_id", biz.id)
    .filter("regexp_replace(phone, \\D, '', 'g')", "eq", phoneKey);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}


