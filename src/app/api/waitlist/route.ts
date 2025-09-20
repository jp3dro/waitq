import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { sendSms } from "@/lib/twilio";

const schema = z.object({
  waitlistId: z.string().uuid(),
  phone: z.string().min(8),
  customerName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parse = schema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = nanoid(16);
  const { waitlistId, phone, customerName } = parse.data;

  // Look up business_id from waitlist to keep entries consistent
  const { data: w, error: wErr } = await supabase
    .from("waitlists")
    .select("business_id")
    .eq("id", waitlistId)
    .single();
  if (wErr) return NextResponse.json({ error: wErr.message }, { status: 400 });

  const { data, error } = await supabase
    .from("waitlist_entries")
    .insert({ business_id: w.business_id, waitlist_id: waitlistId, phone, customer_name: customerName, token })
    .select("id, token")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const statusUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/w/${data.token}`;
  try {
    await sendSms(phone, `You're on the list! Track your spot: ${statusUrl}`);
  } catch {
    // proceed even if SMS fails
  }

  return NextResponse.json({ id: data.id, token: data.token, statusUrl }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Use service role for hard delete regardless of RLS
  const admin = getAdminClient();
  const { error } = await admin.from("waitlist_entries").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}


