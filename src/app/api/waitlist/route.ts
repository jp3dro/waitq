import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { sendSms } from "@/lib/twilio";

const schema = z.object({
  businessId: z.string().uuid(),
  phone: z.string().min(8),
  customerName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parse = schema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = nanoid(16);
  const { businessId, phone, customerName } = parse.data;

  const { data, error } = await supabase
    .from("waitlist_entries")
    .insert({ business_id: businessId, phone, customer_name: customerName, token })
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


