import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const admin = getAdminClient();
  const { data: list, error: listErr } = await admin
    .from("waitlists")
    .select("id, name")
    .eq("display_token", token)
    .single();
  if (listErr || !list) return NextResponse.json({ error: "Invalid display token" }, { status: 404 });

  const { data: entries, error } = await admin
    .from("waitlist_entries")
    .select("id, status, queue_position, ticket_number, notified_at")
    .eq("waitlist_id", list.id)
    .order("ticket_number", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ listId: list.id, listName: list.name, entries: entries ?? [] });
}


