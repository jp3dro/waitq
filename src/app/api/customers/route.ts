import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

// Normalize to digits-only in SQL: regexp_replace(phone, '\\D', '', 'g')

const patchSchema = z.object({
  key: z.string().min(1), // normalized phone or synthetic key like name:... or id:...
  name: z.string().nullable().optional(),
  newPhone: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const json = await req.json();
  const parse = patchSchema.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const { key, name, newPhone } = parse.data;
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

  // Fetch candidate rows for this business
  const { data: rows, error: fetchErr } = await admin
    .from("waitlist_entries")
    .select("id, phone, customer_name, created_at")
    .eq("business_id", biz.id);
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 400 });

  let targetIds: string[] = [];
  if (key.startsWith("name:")) {
    const nameKey = key.slice(5).toLowerCase();
    targetIds = (rows || [])
      .filter((r) => ((r.customer_name || "").toLowerCase() === nameKey))
      .map((r) => r.id);
  } else if (key.startsWith("id:")) {
    const idKey = key.slice(3);
    targetIds = (rows || [])
      .filter((r) => r.id === idKey)
      .map((r) => r.id);
  } else {
    const phoneKey = key.replace(/\D+/g, "");
    targetIds = (rows || [])
      .filter((r) => (r.phone || "").replace(/\D+/g, "") === phoneKey)
      .map((r) => r.id);
  }

  if (targetIds.length === 0) return NextResponse.json({ updated: 0 });

  const { data: updated, error } = await admin
    .from("waitlist_entries")
    .update(updates)
    .in("id", targetIds)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ updated: updated?.length ?? 0 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

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
  // Fetch candidate rows, match by key strategy, and delete by IDs
  const { data: rows, error: fetchErr } = await admin
    .from("waitlist_entries")
    .select("id, phone, customer_name")
    .eq("business_id", biz.id);
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 400 });

  let targetIds: string[] = [];
  if (key.startsWith("name:")) {
    const nameKey = key.slice(5).toLowerCase();
    targetIds = (rows || [])
      .filter((r) => ((r.customer_name || "").toLowerCase() === nameKey))
      .map((r) => r.id);
  } else if (key.startsWith("id:")) {
    const idKey = key.slice(3);
    targetIds = (rows || [])
      .filter((r) => r.id === idKey)
      .map((r) => r.id);
  } else {
    const phoneKey = key.replace(/\D+/g, "");
    targetIds = (rows || [])
      .filter((r) => (r.phone || "").replace(/\D+/g, "") === phoneKey)
      .map((r) => r.id);
  }

  if (targetIds.length === 0) return NextResponse.json({ ok: true });

  const { error } = await admin
    .from("waitlist_entries")
    .delete()
    .in("id", targetIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}


