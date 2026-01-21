import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateListButton from "./create-list-button";
import ListCard from "./list-card";
import { getLocationOpenState, type RegularHours } from "@/lib/location-hours";

export const metadata = { title: "Lists" };

export default async function ListsIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: locations } = await supabase.from("business_locations").select("id, name, regular_hours, timezone").order("created_at", { ascending: true });
  const { data: lists } = await supabase.from("waitlists").select("id, name, location_id, display_token, kiosk_enabled, display_enabled, display_show_name, display_show_qr").order("created_at", { ascending: true });
  const { data: biz } = await supabase.from("businesses").select("name").order("created_at", { ascending: true }).limit(1).maybeSingle();
  const locs = (locations || []) as { id: string; name: string; regular_hours?: unknown; timezone?: string | null }[];
  const allLists = (lists || []) as { id: string; name: string; location_id: string | null; display_token?: string | null; kiosk_enabled?: boolean | null; display_enabled?: boolean | null; display_show_name?: boolean | null; display_show_qr?: boolean | null }[];

  const locationOpenById = new Map(
    locs.map((l) => {
      const st = getLocationOpenState({
        regularHours: (l.regular_hours as RegularHours | null) || null,
        timezone: (typeof l.timezone === "string" ? l.timezone : null) || null,
      });
      return [l.id, st.isOpen] as const;
    })
  );

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
          .eq("status", "seated")
          .not("notified_at", "is", null)
          .order("notified_at", { ascending: false })
          .limit(100);
        const rows = (res.data || []) as { created_at: string; notified_at: string | null }[];
        const durationsMs = rows
          .map((r) => (r.notified_at ? new Date(r.notified_at).getTime() - new Date(r.created_at).getTime() : null))
          .filter((v): v is number => typeof v === "number" && isFinite(v) && v > 0);
        let avgMs = durationsMs.length ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length) : 0;
        // Apply 5-minute minimum when the list is empty
        const { count } = await supabase
          .from("waitlist_entries")
          .select("id", { count: "exact", head: true })
          .eq("waitlist_id", l.id)
          .eq("status", "waiting");
        if ((count || 0) === 0) avgMs = 5 * 60 * 1000;
        return { id: l.id, avgMs } as { id: string; avgMs: number };
      })
    ),
  ]);
  const waitingByList = new Map(waitingCounts.map((w) => [w.id, w.count] as const));
  const etaByList = new Map(estimatedTimes.map((e) => [e.id, e.avgMs] as const));

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Lists</h1>
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
                      const locationIsOpen = l.location_id ? (locationOpenById.get(l.location_id) ?? true) : true;
                      return (
                        <li key={l.id}>
                          <ListCard
                            id={l.id}
                            name={l.name}
                            waiting={waiting}
                            etaDisplay={etaDisplay}
                            displayToken={l.display_token}
                            businessName={(biz?.name as string | null) || undefined}
                            initialLocationId={l.location_id}
                            kioskEnabled={!!l.kiosk_enabled}
                            displayEnabled={l.display_enabled !== false}
                            displayShowName={l.display_show_name === true}
                            displayShowQr={l.display_show_qr === true}
                            locationIsOpen={locationIsOpen}
                            locations={locs}
                            disableDelete={allLists.length <= 1}
                          />
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


