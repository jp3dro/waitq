import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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

  // Counts
  const locationsCount = locations.length;
  const listsCount = lists.length;

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

  // Count total served users across all lists
  const totalServed = await supabase
    .from("waitlist_entries")
    .select("id", { count: "exact", head: true })
    .not("notified_at", "is", null);
  const servedCount = totalServed.count || 0;

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

        {/* Analytics cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-6">
            <p className="text-sm text-neutral-600">Locations</p>
            <p className="mt-2 text-3xl font-semibold">{locationsCount}</p>
          </div>
          <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-6">
            <p className="text-sm text-neutral-600">Lists</p>
            <p className="mt-2 text-3xl font-semibold">{listsCount}</p>
          </div>
          <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-6">
            <p className="text-sm text-neutral-600">Users in queues</p>
            <p className="mt-2 text-3xl font-semibold">{totalWaiting}</p>
          </div>
          <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-6">
            <p className="text-sm text-neutral-600">Users served</p>
            <p className="mt-2 text-3xl font-semibold">{servedCount}</p>
          </div>
        </div>

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
      </div>
    </main>
  );
}


