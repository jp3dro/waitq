import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch locations and lists
  const [locationsDetail, listsDetail] = await Promise.all([
    supabase.from("business_locations").select("id, name").order("created_at", { ascending: true }),
    supabase.from("waitlists").select("id, name, created_at, location_id").order("created_at", { ascending: true }),
  ]);

  const locations = (locationsDetail.data || []) as { id: string; name: string }[];
  const lists = (listsDetail.data || []) as { id: string; name: string; created_at: string; location_id: string | null }[];

  // Per-list waiting counts and estimated times
  const [waitingCounts, estimatedTimes] = await Promise.all([
    Promise.all(
      lists.map(async (l) => {
        const res = await supabase
          .from("waitlist_entries")
          .select("id", { count: "exact", head: true })
          .eq("waitlist_id", l.id)
          .eq("status", "waiting");
        return { id: l.id, count: res.count || 0 } as { id: string; count: number };
      })
    ),
    Promise.all(
      lists.map(async (l) => {
        const res = await supabase
          .from("waitlist_entries")
          .select("created_at, notified_at")
          .eq("waitlist_id", l.id)
          .not("notified_at", "is", null)
          .order("notified_at", { ascending: false })
          .limit(100);
        const rows = (res.data || []) as { created_at: string; notified_at: string | null }[];
        const durationsMs = rows
          .map((r) => (r.notified_at ? new Date(r.notified_at).getTime() - new Date(r.created_at).getTime() : null))
          .filter((v): v is number => typeof v === "number" && isFinite(v) && v > 0);
        const avgMs = durationsMs.length ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length) : 0;
        return { id: l.id, avgMs } as { id: string; avgMs: number };
      })
    ),
  ]);

  const waitingByList = new Map(waitingCounts.map((w) => [w.id, w.count] as const));
  const etaByList = new Map(estimatedTimes.map((e) => [e.id, e.avgMs] as const));
  const totalWaiting = waitingCounts.reduce((sum, w) => sum + w.count, 0);

  // Today's window (UTC)
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  const startISO = startOfDay.toISOString();
  const endISO = endOfDay.toISOString();

  // Aggregate today's visitors and wait times across all lists
  const listIds = lists.map((l) => l.id);
  let todayVisitors = 0;
  let todayAvgWaitMs = 0;
  let hourlyVisits = Array.from({ length: 24 }, () => 0);
  let hourlyWaitMs = Array.from({ length: 24 }, () => 0);
  let hourlyWaitCounts = Array.from({ length: 24 }, () => 0);
  if (listIds.length > 0) {
    const [visitorsHead, waitRows, visitRows] = await Promise.all([
      supabase
        .from("waitlist_entries")
        .select("id", { count: "exact", head: true })
        .in("waitlist_id", listIds)
        .gte("created_at", startISO)
        .lt("created_at", endISO),
      supabase
        .from("waitlist_entries")
        .select("created_at, notified_at")
        .in("waitlist_id", listIds)
        .gte("notified_at", startISO)
        .lt("notified_at", endISO)
        .limit(10000),
      supabase
        .from("waitlist_entries")
        .select("created_at")
        .in("waitlist_id", listIds)
        .gte("created_at", startISO)
        .lt("created_at", endISO)
        .limit(10000),
    ]);

    todayVisitors = visitorsHead.count || 0;
    const waits = (waitRows.data || []) as { created_at: string; notified_at: string | null }[];
    const durations = waits
      .map((r) => (r.notified_at ? new Date(r.notified_at).getTime() - new Date(r.created_at).getTime() : null))
      .filter((v): v is number => typeof v === "number" && isFinite(v) && v > 0);
    todayAvgWaitMs = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

    // Hourly visits from created_at (UTC hour of day)
    const visitRowsArr = (visitRows.data || []) as { created_at: string }[];
    visitRowsArr.forEach((r) => {
      const d = new Date(r.created_at);
      const h = d.getUTCHours();
      hourlyVisits[h] = (hourlyVisits[h] || 0) + 1;
    });
    // Hourly wait time from notified_at hour (UTC)
    waits.forEach((r) => {
      if (!r.notified_at) return;
      const d = new Date(r.notified_at);
      const h = d.getUTCHours();
      const ms = new Date(r.notified_at).getTime() - new Date(r.created_at).getTime();
      if (isFinite(ms) && ms > 0) {
        hourlyWaitMs[h] = (hourlyWaitMs[h] || 0) + ms;
        hourlyWaitCounts[h] = (hourlyWaitCounts[h] || 0) + 1;
      }
    });
  }

  const hourlyWaitAvgMin = hourlyWaitMs.map((ms, i) => {
    const c = hourlyWaitCounts[i] || 0;
    const avgMs = c ? Math.round(ms / c) : 0;
    const totalMin = avgMs ? Math.max(1, Math.round(avgMs / 60000)) : 0;
    return totalMin;
  });

  // Business info for header
  type BusinessHeader = { name: string | null; logo_url: string | null } | null;
  const { data: biz } = await supabase
    .from("businesses")
    .select("name, logo_url")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const businessHeader = (biz as BusinessHeader);

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
            {businessHeader?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={businessHeader.logo_url || ""} alt="Logo" className="h-8 w-8 rounded object-cover ring-1 ring-neutral-200" />
            ) : null}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{businessHeader?.name || "Dashboard"}</h1>
            </div>
          </div>
        </div>

        {/* Removed old insights cards */}

        {/* Lists grouped by location with waiting counts and ETA */}
        <div className="space-y-6">
          {locations.length === 0 ? (
            <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-10 text-center">
              <h3 className="text-base font-semibold">No locations yet</h3>
              <p className="mt-1 text-sm text-neutral-600">Create a location to start adding lists.</p>
            </div>
          ) : (
            locations.map((loc) => {
              const listsForLoc = lists.filter((l) => l.location_id === loc.id);
              if (listsForLoc.length === 0) return null;
              return (
                <section key={loc.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">{loc.name}</h2>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listsForLoc.map((l) => {
                      const waiting = waitingByList.get(l.id) || 0;
                      const etaMs = etaByList.get(l.id) || 0;
                      const totalMin = etaMs ? Math.max(1, Math.round(etaMs / 60000)) : 0;
                      const hours = Math.floor(totalMin / 60);
                      const minutes = totalMin % 60;
                      const etaDisplay = totalMin > 0 ? (hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`) : '—';
                      return (
                        <li key={l.id}>
                          <Link href={`/lists/${l.id}`} className="block bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-5 hover:shadow hover:bg-neutral-50 transition cursor-pointer">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{l.name}</p>
                                <div className="mt-1 flex items-center gap-3 text-xs text-neutral-600">
                                  <span>Waiting: {waiting}</span>
                                  <span>ETA: {etaDisplay}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })
          )}
        </div>

        {/* Today's Analytics */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Today’s analytics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-6">
              <p className="text-sm text-neutral-600">Total visitors (today)</p>
              <p className="mt-2 text-3xl font-semibold">{todayVisitors}</p>
            </div>
            <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-6">
              <p className="text-sm text-neutral-600">Avg wait time (today)</p>
              <p className="mt-2 text-3xl font-semibold">
                {(() => {
                  const totalMin = todayAvgWaitMs ? Math.max(1, Math.round(todayAvgWaitMs / 60000)) : 0;
                  const hours = Math.floor(totalMin / 60);
                  const minutes = totalMin % 60;
                  return totalMin > 0 ? (hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`) : '—';
                })()}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-6">
              <p className="text-sm text-neutral-600">Hourly visits (today)</p>
              <BarChart labels={[...Array(24).keys()].map((h) => `${String(h).padStart(2, '0')}`)} values={hourlyVisits} maxBars={24} color="#111827" />
            </div>
            <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-6">
              <p className="text-sm text-neutral-600">Avg wait time by hour (today)</p>
              <BarChart labels={[...Array(24).keys()].map((h) => `${String(h).padStart(2, '0')}`)} values={hourlyWaitAvgMin} maxBars={24} color="#FF9500" suffix="m" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function BarChart({ labels, values, maxBars = 24, color = "#111827", suffix = "" }: { labels: string[]; values: number[]; maxBars?: number; color?: string; suffix?: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="mt-3">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(maxBars, labels.length)}, minmax(0, 1fr))`, gap: '8px' }}>
        {values.slice(0, maxBars).map((v, i) => (
          <div key={i} className="flex flex-col items-center justify-end gap-2">
            <div className="w-full rounded-md relative group" style={{ height: `${(v / max) * 120 + 2}px`, backgroundColor: color }}>
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-black text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                {labels[i]}: {v}{suffix}
              </div>
            </div>
            <div className="text-[10px] text-neutral-500">{labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


