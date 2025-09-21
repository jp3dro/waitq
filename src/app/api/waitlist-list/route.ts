import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const waitlistId = searchParams.get("waitlistId");
  const supabase = await createRouteClient();
  let q = supabase
    .from("waitlist_entries")
    .select("id, customer_name, phone, status, queue_position, created_at, ticket_number");
  if (waitlistId) {
    q = q.eq("waitlist_id", waitlistId);
  }
  const { data, error } = await q.order("queue_position", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entries: data ?? [] });
}


