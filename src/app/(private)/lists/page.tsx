import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateListButton from "./create-list-button";
import ListCard from "./list-card";

export const metadata = { title: "Lists" };

export default async function ListsIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: locations } = await supabase.from("business_locations").select("id, name").order("created_at", { ascending: true });
  const { data: lists } = await supabase.from("waitlists").select("id, name, location_id, display_token").order("created_at", { ascending: true });
  const locs = (locations || []) as { id: string; name: string }[];
  const allLists = (lists || []) as { id: string; name: string; location_id: string | null; display_token?: string | null }[];

  // Per-list waiting counts and estimated times (reuse dashboard logic)
  const [waitingCounts, estimatedTimes] = await Promise.all([
    Promise.all(
      allLists.map(async (l) => {
        const res = await supabase
          .from("waitlist_entries")
          .select("id", { count: "exact", head: true })
          .eq("waitlist_id", l.id)
          .eq("status", "waiting");
        return { id: l.id, count: res.count || 0 } as { id: string; count: number };
      })
    ),
    Promise.all(
      allLists.map(async (l) => {
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

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lists</h1>
          </div>
          <CreateListButton />
        </div>

        <div className="space-y-6">
          {locs.length === 0 ? (
            <div className="p-10 text-center ring-1 ring-border rounded-xl bg-card text-card-foreground">
              <h3 className="text-base font-semibold">No locations yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Create a location to start adding lists.</p>
            </div>
          ) : (
            locs.map((loc) => {
              const listsForLoc = allLists.filter((l) => l.location_id === loc.id);
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
                          <ListCard id={l.id} name={l.name} waiting={waiting} etaDisplay={etaDisplay} displayToken={l.display_token} />
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


