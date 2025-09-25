"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Entry = { status: string; created_at: string; eta_minutes: number | null; queue_position: number | null; waitlist_id?: string; ticket_number?: number | null; notified_at?: string | null };
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
      if (pollTimer.current) window.clearInterval(pollTimer.current);
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
  }, [supabase, data?.waitlist_id]);

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
  }, [supabase, data?.waitlist_id]);

  if (loading || !data) return (
    <main className="p-8">
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-6">
          <p className="text-sm text-neutral-600">Loading…</p>
        </div>
      </div>
    </main>
  );

  const isUserTurn = data.ticket_number !== null && data.ticket_number === nowServing;

  return (
    <main className="p-8">
      <div className="max-w-xl mx-auto">
        <div className={`rounded-2xl ring-1 shadow-sm p-6 ${
          isUserTurn
            ? "bg-gradient-to-br from-green-50 to-emerald-50 ring-green-200 border-green-200"
            : "bg-white ring-black/5"
        }`}>
          <Header business={business} />

          {isUserTurn ? (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">It&apos;s your turn!</h2>
              <p className="text-lg text-green-700 mb-4">
                Please proceed to {business?.name || "the venue"}
              </p>
              <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-green-800">Your number:</span>
                <span className="text-xl font-bold text-green-900">{data.ticket_number}</span>
              </div>
            </div>
          ) : (
            <>
              {nowServing ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Now serving</span>
                  <span className="text-2xl font-bold">{nowServing}</span>
                </div>
              ) : null}
              <div className="mt-4 grid gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Status</span>
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">{data.status}</span>
                </div>
                {data.eta_minutes ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-600">ETA</span>
                    <span className="text-sm font-medium">{data.eta_minutes} min</span>
                  </div>
                ) : null}
                {typeof data.queue_position === "number" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-600">Position</span>
                    <span className="text-sm font-medium">{data.queue_position}</span>
                  </div>
                ) : null}
              </div>
              <p className="mt-6 text-sm text-neutral-600">This page updates automatically as the venue advances the queue.</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function Header({ business }: { business: Business }) {
  if (!business) {
    return <h1 className="text-xl font-semibold">Your place in line</h1>;
  }
  return (
    <div className="flex items-center gap-3">
      {business.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={business.logo_url} alt="Logo" className="h-8 w-8 rounded object-cover ring-1 ring-neutral-200" />
      ) : null}
      <div>
        <h1 className="text-xl font-semibold">{business.name || "Your place in line"}</h1>
      </div>
    </div>
  );
}


