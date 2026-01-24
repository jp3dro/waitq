import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { resolveCurrentBusinessId } from "@/lib/current-business";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function isMissingColumnError(errMsg: string, column: string) {
  const m = errMsg.toLowerCase();
  const c = column.toLowerCase();
  return (
    m.includes(`could not find the '${c}' column`) ||
    m.includes(`could not find the "${c}" column`) ||
    m.includes(`column ${c} does not exist`) ||
    m.includes(`column "${c}" does not exist`) ||
    // Some PostgREST errors include table-qualified column names.
    (m.includes("does not exist") && m.includes(c)) ||
    (m.includes("schema cache") && m.includes(c))
  );
}

export async function GET(req: NextRequest) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await resolveCurrentBusinessId(supabase as any, user.id);
  if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId") || "all";
  const waitlistId = searchParams.get("waitlistId") || "all";
  const dateRange = (searchParams.get("dateRange") || "today") as "today" | "yesterday" | "7" | "15" | "30";
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") || "50") || 50));

  const now = new Date();
  let fromDate: Date;
  if (dateRange === "today") {
    fromDate = startOfDay(now);
  } else if (dateRange === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    fromDate = startOfDay(y);
  } else {
    const days = Number(dateRange);
    fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  const admin = getAdminClient();

  // Determine waitlistIds filter
  let waitlistIds: string[] | null = null;
  if (waitlistId !== "all") {
    waitlistIds = [waitlistId];
  } else if (locationId !== "all") {
    const { data: wls, error: wlsErr } = await admin
      .from("waitlists")
      .select("id")
      .eq("business_id", businessId)
      .eq("location_id", locationId);
    if (wlsErr) return NextResponse.json({ error: wlsErr.message }, { status: 400 });
    waitlistIds = (wls ?? []).map((w) => w.id as string);
    if (waitlistIds.length === 0) {
      return NextResponse.json({ visits: [], count: 0 });
    }
  }

  const baseSelect = "id, customer_name, phone, email, party_size, seating_preference, status, created_at, notified_at, waitlist_id, visits_count, is_returning";

  let q = admin
    .from("waitlist_entries")
    .select(baseSelect, { count: "exact" })
    .eq("business_id", businessId)
    .gte("created_at", fromDate.toISOString())
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (waitlistIds && waitlistIds.length) q = q.in("waitlist_id", waitlistIds);

  let res = await q;

  // Back-compat for deployments without visits_count/is_returning columns
  if (
    res.error &&
    (isMissingColumnError(res.error.message, "visits_count") ||
      isMissingColumnError(res.error.message, "is_returning") ||
      res.error.message.toLowerCase().includes("visits_count") ||
      res.error.message.toLowerCase().includes("is_returning"))
  ) {
    let q2 = admin
      .from("waitlist_entries")
      .select("id, customer_name, phone, email, party_size, seating_preference, status, created_at, notified_at, waitlist_id", { count: "exact" })
      .eq("business_id", businessId)
      .gte("created_at", fromDate.toISOString())
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (waitlistIds && waitlistIds.length) q2 = q2.in("waitlist_id", waitlistIds);
    res = await q2;
  }

  if (res.error) {
    console.error("[customer-visits] query failed", {
      businessId,
      locationId,
      waitlistId,
      dateRange,
      page,
      pageSize,
      error: res.error,
    });
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  }

  return NextResponse.json({
    visits: res.data ?? [],
    count: typeof res.count === "number" ? res.count : 0,
  });
}

