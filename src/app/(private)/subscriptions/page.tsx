export const metadata = { title: "Subscription" };
export const dynamic = "force-dynamic";

import { orderedPlans } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { countEntriesInPeriod, countLocations, countSmsInPeriod, getPlanContext } from "@/lib/plan-limits";
import PlanCards from "@/components/subscriptions/PlanCards";
import SubscriptionReturnRefresh from "@/components/subscription-return-refresh";
import { Progress } from "@/components/ui/progress";
import { DateTimeText } from "@/components/date-time-text";
import { syncPolarSubscriptionForUser } from "@/lib/polar-sync";

type PolarOrder = {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  currency: string;
  is_invoice_generated?: boolean;
  invoice_number?: string | null;
};

type PolarOrderWithInvoice = PolarOrder & { invoiceUrl?: string | null };

function polarApiBase() {
  const server = (process.env.POLAR_SERVER || "").toLowerCase().trim();
  return server === "production" ? "https://api.polar.sh" : "https://sandbox-api.polar.sh";
}

function formatCurrencyMinor(amountMinor: number, currency: string) {
  const c = (currency || "usd").toUpperCase();
  const major = amountMinor / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(major);
}

type SubscriptionData = {
  plan_id: string | null;
  status: string | null;
  price_lookup_key?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
};

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let current: SubscriptionData | null = null;
  let polarOrders: PolarOrderWithInvoice[] = [];
  let usageSummary:
    | {
      locations: { used: number; limit: number };
      users: { used: number; limit: number };
      reservations: { used: number; limit: number };
      sms: { used: number; limit: number };
      windowStart: string;
      windowEnd: string;
    }
    | null = null;

  // Sync subscription from Polar
  if (user) {
    try {
      await syncPolarSubscriptionForUser({ userId: user.id });
    } catch {
      // ignore; UI will fall back to cached DB row
    }

    // Read subscription from DB
    const { data: existingRow } = await supabase
      .from("subscriptions")
      .select("plan_id, status, price_lookup_key, current_period_start, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .neq("status", "canceled")
      .maybeSingle();

    current = (existingRow as SubscriptionData) || null;
  }

  // Fetch Polar payment history (orders)
  if (user) {
    try {
      const token = process.env.POLAR_ACCESS_TOKEN;
      if (token) {
        const listUrl = new URL("/v1/orders", polarApiBase());
        listUrl.searchParams.set("limit", "12");
        listUrl.searchParams.set("sorting", "-created_at");
        listUrl.searchParams.set("metadata[user_id]", user.id);

        const res = await fetch(listUrl.toString(), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.ok) {
          const json = (await res.json()) as { items?: PolarOrder[] };
          const items = Array.isArray(json.items) ? json.items : [];

          polarOrders = await Promise.all(
            items.map(async (o) => {
              let invoiceUrl: string | null = null;
              if (o.is_invoice_generated) {
                try {
                  const invUrl = new URL(`/v1/orders/${o.id}/invoice`, polarApiBase());
                  const invRes = await fetch(invUrl.toString(), {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                  });
                  if (invRes.ok) {
                    const invJson = (await invRes.json()) as { url?: string | null };
                    invoiceUrl = typeof invJson.url === "string" ? invJson.url : null;
                  }
                } catch {
                  // ignore
                }
              }
              return { ...o, invoiceUrl };
            })
          );
        }
      }
    } catch {
      // ignore
    }
  }

  // Calculate usage summary
  if (user) {
    try {
      const admin = getAdminClient();
      let businessId: string | null = null;
      const { data: owned } = await admin
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      businessId = (owned?.id as string | undefined) || null;
      if (!businessId) {
        const { data: memberOf } = await admin
          .from("memberships")
          .select("business_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        businessId = (memberOf?.business_id as string | undefined) || null;
      }
      if (businessId) {
        const { data: bizOwner } = await admin
          .from("businesses")
          .select("owner_user_id")
          .eq("id", businessId)
          .maybeSingle();
        const ctx = await getPlanContext(businessId);
        const memberCountPromise = (() => {
          let q = admin
            .from("memberships")
            .select("id", { count: "exact", head: true })
            .eq("business_id", businessId)
            .eq("status", "active");
          const ownerId = (bizOwner?.owner_user_id as string | undefined) || null;
          if (ownerId) q = q.neq("user_id", ownerId);
          return q.then((res) => res.count || 0);
        })();

        const [usedLocations, usedReservations, usedSms, memberCount] = await Promise.all([
          countLocations(businessId),
          countEntriesInPeriod(businessId, ctx.window.start, ctx.window.end),
          countSmsInPeriod(businessId, ctx.window.start, ctx.window.end),
          memberCountPromise,
        ]);
        const usedUsers = (bizOwner?.owner_user_id ? 1 : 0) + memberCount;
        usageSummary = {
          locations: { used: usedLocations, limit: ctx.limits.locations },
          users: { used: usedUsers, limit: ctx.limits.users },
          reservations: { used: usedReservations, limit: ctx.limits.reservationsPerMonth },
          sms: { used: usedSms, limit: ctx.limits.messagesPerMonth },
          windowStart: ctx.window.start.toISOString(),
          windowEnd: ctx.window.end.toISOString(),
        };
      }
    } catch { }
  }

  // Determine current plan
  const activeLikeStatuses = new Set(["active", "trialing", "past_due", "paid", "confirmed", "complete", "completed", "succeeded"]);
  let currentPlanId: string = "free";
  if (current && current.status && activeLikeStatuses.has(current.status)) {
    if (current.plan_id) {
      currentPlanId = current.plan_id;
    } else if (current.price_lookup_key) {
      const matchByLookup = orderedPlans.find((p) => p.id.toUpperCase() === current!.price_lookup_key);
      if (matchByLookup) currentPlanId = matchByLookup.id;
    }
  }

  return (
    <main className="py-5">
      <SubscriptionReturnRefresh />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Subscription</h1>
          </div>
        </div>

        <PlanCards mode="manage" currentPlanId={currentPlanId} />

        <div className="grid grid-cols-1 gap-4">
          {usageSummary ? (
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
              <div className="text-lg font-semibold mb-3">Usage</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {[
                  { label: "Locations", value: usageSummary.locations },
                  { label: "Users", value: usageSummary.users },
                  { label: "Reservations", value: usageSummary.reservations },
                  { label: "SMS", value: usageSummary.sms },
                ].map((item) => {
                  const pct = item.value.limit > 0 ? Math.min(100, Math.round((item.value.used / item.value.limit) * 100)) : 0;
                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-muted-foreground">{item.label}</div>
                        <div className="font-medium">{item.value.used} / {item.value.limit}</div>
                      </div>
                      <Progress value={pct} />
                    </div>
                  );
                })}
                {currentPlanId !== "free" ? (
                  <div className="md:col-span-2">
                    <div className="text-muted-foreground">Usage period</div>
                    <div className="font-medium">
                      {new Date(usageSummary.windowStart).toLocaleDateString()} - {new Date(usageSummary.windowEnd).toLocaleDateString()}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
            <div className="text-lg font-semibold mb-3">Payment History</div>
            {polarOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {polarOrders.map((o) => (
                      <tr key={o.id} className="border-t border-border/60">
                        <td className="py-2 pr-4"><DateTimeText value={new Date(o.created_at).getTime()} /></td>
                        <td className="py-2 pr-4">{formatCurrencyMinor(o.total_amount || 0, o.currency || "usd")}</td>
                        <td className="py-2 pr-4 capitalize">{o.status}</td>
                        <td className="py-2 pr-4">
                          {o.invoiceUrl ? (
                            <a className="text-primary underline" href={o.invoiceUrl} target="_blank" rel="noreferrer">View</a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-2">No payment history yet.</div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
