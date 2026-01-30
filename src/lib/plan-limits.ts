import { getAdminClient } from "@/lib/supabase/admin";
import { getPlanById, type PlanId } from "@/lib/plans";

const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

function getMonthWindow(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return { start, end };
}

function coerceDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function getPlanContext(businessId: string) {
  const admin = getAdminClient();
  
  // First check for active subscriptions
  const { data: activeSubscription } = await admin
    .from("subscriptions")
    .select("plan_id, current_period_start, current_period_end, status, updated_at")
    .eq("business_id", businessId)
    .in("status", ACTIVE_STATUSES)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If there's an active subscription, use it
  if (activeSubscription) {
    const planId = (activeSubscription.plan_id as PlanId | null) || "free";
    const limits = getPlanById(planId).limits;
    const start = coerceDate(activeSubscription.current_period_start) || null;
    const end = coerceDate(activeSubscription.current_period_end) || null;
    const window = start && end && end > start ? { start, end } : getMonthWindow();
    return { planId, limits, window };
  }

  // Free tier: usage resets monthly just like paid plans
  const planId = "free" as const;
  const limits = getPlanById(planId).limits;
  const window = getMonthWindow();
  return { planId, limits, window };
}

export async function countLocations(businessId: string) {
  const admin = getAdminClient();
  const { count } = await admin
    .from("business_locations")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);
  return count || 0;
}

export async function countEntriesInPeriod(businessId: string, start: Date, end: Date) {
  const admin = getAdminClient();
  const { count } = await admin
    .from("waitlist_entries")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());
  return count || 0;
}

export async function countSmsInPeriod(businessId: string, start: Date, end: Date) {
  const admin = getAdminClient();
  const { count } = await admin
    .from("waitlist_entries")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .in("sms_status", ["sent", "delivered"])
    .gte("sms_sent_at", start.toISOString())
    .lt("sms_sent_at", end.toISOString());
  return count || 0;
}
