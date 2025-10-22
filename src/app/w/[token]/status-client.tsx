"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Entry = { status: string; created_at: string; eta_minutes: number | null; queue_position: number | null; waitlist_id?: string; ticket_number?: number | null; notified_at?: string | null; seating_preference?: string | null; party_size?: number | null };
type Business = { name: string | null; logo_url: string | null } | null;

export default function ClientStatus({ token }: { token: string }) {
  const supabase = createClient();
  const [data, setData] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const pollTimer = useRef<number | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [nowServing, setNowServing] = useState<number | null>(null);
  const bcRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [business, setBusiness] = useState<Business>(null);

  async function load(silent: boolean = false) {
    if (!silent && !data) setLoading(true);
    const res = await fetch(`/api/w-status?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    const j = await res.json();
    const entry = (j.entry as Entry) || null;
    setData((prev) => ({ ...(prev || entry || null), ...(entry || {}) } as Entry));
    setNowServing(j.nowServing ?? null);
    setBusiness(j.business || null);
    if (!silent || !data) setLoading(false);
  }

  useEffect(() => {
    load();
    // Optional: disable polling fallback; rely only on realtime
    // pollTimer.current = window.setInterval(() => {
    //   load(true);
    // }, 2000);
    return () => {
      const id = pollTimer.current;
      if (id) window.clearInterval(id);
    };
  }, [token]);

  // Realtime subscription by waitlist_id when known
  useEffect(() => {
    if (!data?.waitlist_id) return;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    const channel = supabase
      .channel(`user-status-${data.waitlist_id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waitlist_entries", filter: `waitlist_id=eq.${data.waitlist_id}` },
        () => {
          // Refresh silently on any change in the same waitlist
          load(true);
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [supabase, data?.waitlist_id, load]);

  // Broadcast fallback: dashboard sends refresh on call; listen and refresh silently
  useEffect(() => {
    if (!data?.waitlist_id) return;
    if (bcRef.current) {
      supabase.removeChannel(bcRef.current);
      bcRef.current = null;
    }
    const chan = supabase
      .channel(`user-wl-${data.waitlist_id}`)
      .on('broadcast', { event: 'refresh' }, () => load(true))
      .subscribe();
    bcRef.current = chan;
    return () => {
      if (bcRef.current) supabase.removeChannel(bcRef.current);
      bcRef.current = null;
    };
  }, [supabase, data?.waitlist_id, load]);

  if (loading || !data) return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 h-14 flex items-center justify-between">
          <span className="font-semibold text-lg tracking-tight">&nbsp;</span>
        </div>
      </header>
      <main className="p-8">
        <div className="max-w-xl mx-auto">
          <div className="rounded-2xl bg-card text-card-foreground ring-1 ring-border shadow-sm p-6">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        </div>
      </main>
    </div>
  );

  const isUserTurn = data.ticket_number !== null && data.ticket_number === nowServing;

  const yourNumber = typeof data.ticket_number === 'number' ? data.ticket_number : (typeof data.queue_position === 'number' ? data.queue_position : null);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 h-14 flex items-center gap-3 justify-between">
          {business?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logo_url} alt="Logo" className="h-8 w-8 rounded object-cover ring-1 ring-border" />
          ) : null}
          <span className="font-semibold text-lg tracking-tight">{business?.name || ""}</span>
          <div>
            <Link href="#" aria-label="Toggle theme" className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-muted">
              {/* We reuse the theme toggle component visuals here: */}
              <span className="sr-only">Toggle theme</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="p-8">
        <div className="max-w-xl mx-auto">
          <div className={`rounded-2xl ring-1 shadow-sm p-6 ${
            isUserTurn
              ? "bg-accent/10 ring-primary/50"
              : "bg-card text-card-foreground ring-border"
          }`}>
            {isUserTurn ? (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-primary">It&apos;s your turn!</h2>
                <p className="mt-2 text-foreground">Please proceed to {business?.name || "the venue"}</p>
                {typeof yourNumber === 'number' ? (
                  <div className="mt-6">
                    <div className="text-sm text-foreground">Your number</div>
                    <div className="mt-1 text-6xl font-extrabold text-foreground">{yourNumber}</div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Your number</div>
                <div className="mt-1 text-7xl font-extrabold text-foreground">{typeof yourNumber === 'number' ? yourNumber : '-'}</div>
                <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
                  {data.seating_preference ? (
                    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium">{data.seating_preference}</span>
                  ) : null}
                  {typeof data.party_size === 'number' ? (
                    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium">Party: {data.party_size}</span>
                  ) : null}
                  <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium capitalize">{data.status}</span>
                </div>
                <div className="mt-8">
                  <div className="text-sm text-muted-foreground">Now serving</div>
                  <div className="mt-1 text-5xl font-bold text-foreground">{typeof nowServing === 'number' ? nowServing : '-'}</div>
                </div>
                {typeof data.eta_minutes === 'number' ? (
                  <div className="mt-4 text-sm text-foreground">Estimated wait: <span className="font-medium">{data.eta_minutes} min</span></div>
                ) : null}
              </div>
            )}
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">This page updates automatically as the venue advances the queue.</p>
          <div className="mt-6 flex items-center justify-center">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <span className="text-sm">Powered by</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/waitq.svg" alt="WaitQ" className="h-4 w-auto" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}


