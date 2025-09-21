"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type Entry = {
  id: string;
  customer_name: string | null;
  phone: string;
  status: string;
  queue_position: number | null;
  created_at: string;
};

export default function WaitlistTable() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [waitlists, setWaitlists] = useState<{ id: string; name: string }[]>([]);
  const [waitlistId, setWaitlistId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const supabase = createClient();
  const refreshTimer = useRef<number | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());

  async function load(silent: boolean = false) {
    if (!silent) setLoading(true);
    const url = waitlistId ? `/api/waitlist-list?waitlistId=${encodeURIComponent(waitlistId)}` : "/api/waitlist-list";
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as { entries: Entry[] };

    // Compute new ids for highlight animation
    const incoming = data.entries || [];
    const incomingIds = new Set(incoming.map((e) => e.id));
    const prevIds = prevIdsRef.current;
    const newIds = new Set<string>();
    incoming.forEach((e) => {
      if (!prevIds.has(e.id)) newIds.add(e.id);
    });
    if (newIds.size > 0) {
      setHighlightIds(newIds);
      window.setTimeout(() => setHighlightIds(new Set()), 1200);
    }
    prevIdsRef.current = incomingIds;

    setEntries(incoming);
    if (!silent) setLoading(false);
  }

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/waitlists", { cache: "no-store" });
      const j = await res.json();
      setWaitlists(j.waitlists || []);
      if ((j.waitlists || []).length > 0) setWaitlistId(j.waitlists[0].id);
    })();
  }, []);

  useEffect(() => {
    load(false);
  }, [waitlistId]);

  // Realtime: subscribe to entries for selected waitlist
  useEffect(() => {
    if (!waitlistId) return;
    const channel = supabase
      .channel(`waitlist-entries-${waitlistId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waitlist_entries", filter: `waitlist_id=eq.${waitlistId}` },
        () => {
          // Debounce rapid bursts
          if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
          refreshTimer.current = window.setTimeout(() => {
            load(true);
          }, 150);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, waitlistId]);

  // Realtime: watch waitlists list updates
  useEffect(() => {
    const channel = supabase
      .channel("waitlists-meta")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waitlists" },
        () => reloadWaitlists()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function reloadWaitlists(selectId?: string) {
    const res = await fetch("/api/waitlists", { cache: "no-store" });
    const j = await res.json();
    setWaitlists(j.waitlists || []);
    if (selectId) setWaitlistId(selectId);
    else if ((j.waitlists || []).length > 0) setWaitlistId(j.waitlists[0].id);
  }

  // Deleting lists is managed in Settings → Lists

  const remove = (id: string) => {
    startTransition(async () => {
      await fetch(`/api/waitlist?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await load(true);
    });
  };

  if (loading) return (
    <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-6">
      <p className="text-sm text-neutral-600">Loading…</p>
    </div>
  );

  if (!loading && entries.length === 0) return (
    <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-10 text-center">
      <h2 className="text-base font-semibold">No entries yet</h2>
      <p className="mt-1 text-sm text-neutral-600">Add your first guest to start the queue.</p>
    </div>
  );

  return (
    <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Waiting queue</h2>
          <select className="rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 px-2 py-1 text-sm" value={waitlistId ?? ""} onChange={(e) => setWaitlistId(e.target.value)}>
            {waitlists.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>
      {msg ? (
        <div className="px-6 py-2 text-sm text-red-700">{msg}</div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 sticky top-0 z-10">
            <tr>
              <th className="text-left p-2">Position</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Phone</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className={`border-t hover:bg-neutral-50 ${highlightIds.has(e.id) ? "row-flash" : ""}`}>
                <td className="p-2">{e.queue_position ?? "-"}</td>
                <td className="p-2">{e.customer_name ?? "—"}</td>
                <td className="p-2">{e.phone}</td>
                <td className="p-2">{e.status}</td>
                <td className="p-2">{new Date(e.created_at).toLocaleString()}</td>
                <td className="p-2 text-right">
                  <button disabled={isPending} onClick={() => remove(e.id)} className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


