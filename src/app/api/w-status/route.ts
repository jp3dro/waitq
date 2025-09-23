import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const admin = getAdminClient();
  const { data: entry, error: e1 } = await admin
    .from("waitlist_entries")
    .select("status, created_at, eta_minutes, queue_position, token, waitlist_id, ticket_number, business_id")
    .eq("token", token)
    .single();
  if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });

  let nowServing: number | null = null;
  let business: { name: string | null; logo_url: string | null } | null = null;
  if (entry?.waitlist_id) {
    const { data } = await admin
      .from("waitlist_entries")
      .select("ticket_number, notified_at, status")
      .eq("waitlist_id", entry.waitlist_id)
      .in("status", ["notified", "seated"]) 
      .order("notified_at", { ascending: false, nullsFirst: false })
      .order("ticket_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    nowServing = data?.ticket_number ?? null;
  }

  if (entry?.business_id) {
    const { data: biz } = await admin
      .from("businesses")
      .select("name, logo_url")
      .eq("id", entry.business_id)
      .limit(1)
      .maybeSingle();
    if (biz) business = { name: (biz as any).name ?? null, logo_url: (biz as any).logo_url ?? null };
  }

  return NextResponse.json({ entry, nowServing, business });
}


