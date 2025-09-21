"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Entry = { id: string; ticket_number: number | null; queue_position: number | null; status: string; notified_at?: string | null };
type Payload = { listId: string; listName: string; entries: Entry[] };

export default function DisplayClient({ token }: { token: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<number | null>(null);
  const prev = useRef<Payload | null>(null);
  const supabase = createClient();
  const subCreated = useRef<boolean>(false);
  const bcCreated = useRef<boolean>(false);

  async function load(silent: boolean = false) {
    if (!silent && !data) setLoading(true);
    const res = await fetch(`/api/display?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    const j = (await res.json()) as Payload;
    // Ensure consistent order in UI: by ticket_number ascending
    j.entries = (j.entries || []).slice().sort((a, b) => (a.ticket_number ?? 0) - (b.ticket_number ?? 0));
    // Smooth update: preserve previous state to avoid flicker when shape is same
    if (prev.current && j && prev.current.listId === j.listId) {
      setData((cur) => ({ ...(cur || j), ...j }));
    } else {
      setData(j);
    }
    prev.current = j;
    if (!silent || !data) setLoading(false);
  }

  useEffect(() => {
    load();
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [token]);

  // Optional: disable polling fallback; rely only on realtime and broadcast
  // useEffect(() => {
  //   const id = window.setInterval(() => load(true), 2000);
  //   return () => window.clearInterval(id);
  // }, [token]);

  useEffect(() => {
    if (!data?.listId || subCreated.current) return;
    const channel = supabase
      .channel(`public-display-${data.listId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waitlist_entries", filter: `waitlist_id=eq.${data.listId}` },
        () => {
          if (timer.current) window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => load(true), 100);
        }
      )
      .subscribe();
    subCreated.current = true;
    return () => {
      supabase.removeChannel(channel);
      subCreated.current = false;
    };
  }, [supabase, data?.listId]);

  // Broadcast fallback: listen for refresh notifications from dashboard
  useEffect(() => {
    if (bcCreated.current) return;
    const channel = supabase
      .channel(`display-bc-${token}`)
      .on('broadcast', { event: 'refresh' }, () => {
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => load(true), 100);
      })
      .subscribe();
    bcCreated.current = true;
    return () => {
      supabase.removeChannel(channel);
      bcCreated.current = false;
    };
  }, [supabase, token]);

  if (loading || !data) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-neutral-400">Loading…</p>
    </main>
  );

  const notified = data.entries.filter((e) => e.status === "notified");
  const nowServing = notified.length
    ? notified
        .slice()
        .sort((a, b) => {
          const ad = a.notified_at ? new Date(a.notified_at).getTime() : 0;
          const bd = b.notified_at ? new Date(b.notified_at).getTime() : 0;
          if (ad !== bd) return bd - ad; // latest notified first
          return (b.ticket_number ?? 0) - (a.ticket_number ?? 0);
        })[0]
    : null;
  const waiting = data.entries.filter((e) => e.status === "waiting").slice(0, 10);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{data.listName}</h1>
        <div className="mt-8 grid md:grid-cols-[1fr_1.2fr] gap-8">
          <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">
            <h2 className="text-base text-neutral-300">Now serving</h2>
            {nowServing ? (
              <div className="mt-2 text-6xl font-extrabold">{nowServing.ticket_number ?? nowServing.queue_position ?? "-"}</div>
            ) : (
              <div className="mt-2 text-neutral-400">No one is being served</div>
            )}
          </section>
          <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">
            <h2 className="text-base text-neutral-300">Up next</h2>
            <ul className="mt-2 divide-y divide-white/10">
              {waiting.map((e) => (
                <li key={e.id} className="py-3 flex items-center justify-between">
                  <span className="text-lg font-medium">&nbsp;</span>
                  <span className="text-2xl font-semibold">{e.ticket_number ?? e.queue_position ?? "-"}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}


