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
    <div className="min-h-dvh bg-[#F6F8FA]">
      <header className="border-b border-default bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 h-14 flex items-center justify-start">
          <span className="font-semibold text-lg tracking-tight text-neutral-900">&nbsp;</span>
        </div>
      </header>
      <main className="p-8">
        <div className="max-w-xl mx-auto">
          <div className="rounded-2xl bg-white ring-1 ring-default shadow-sm p-6">
            <p className="text-sm text-neutral-600">Loading…</p>
          </div>
        </div>
      </main>
    </div>
  );

  const isUserTurn = data.ticket_number !== null && data.ticket_number === nowServing;

  const yourNumber = typeof data.ticket_number === 'number' ? data.ticket_number : (typeof data.queue_position === 'number' ? data.queue_position : null);

  return (
    <div className="min-h-dvh bg-[#F6F8FA]">
      <header className="border-b border-default bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 h-14 flex items-center gap-3">
          {business?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logo_url} alt="Logo" className="h-8 w-8 rounded object-cover ring-1 ring-neutral-200" />
          ) : null}
          <span className="font-semibold text-lg tracking-tight text-neutral-900">{business?.name || ""}</span>
        </div>
      </header>
      <main className="p-8">
        <div className="max-w-xl mx-auto">
          <div className={`rounded-2xl ring-1 shadow-sm p-6 ${
            isUserTurn
              ? "bg-gradient-to-br from-green-50 to-emerald-50 ring-green-200"
              : "bg-white ring-default"
          }`}>
            {isUserTurn ? (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-green-800">It&apos;s your turn!</h2>
                <p className="mt-2 text-green-700">Please proceed to {business?.name || "the venue"}</p>
                {typeof yourNumber === 'number' ? (
                  <div className="mt-6">
                    <div className="text-sm text-green-800">Your number</div>
                    <div className="mt-1 text-6xl font-extrabold text-green-900">{yourNumber}</div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-sm text-neutral-600">Your number</div>
                <div className="mt-1 text-7xl font-extrabold text-neutral-900">{typeof yourNumber === 'number' ? yourNumber : '-'}</div>
                <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
                  {data.seating_preference ? (
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-800">{data.seating_preference}</span>
                  ) : null}
                  {typeof data.party_size === 'number' ? (
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-800">Party: {data.party_size}</span>
                  ) : null}
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-800 capitalize">{data.status}</span>
                </div>
                <div className="mt-8">
                  <div className="text-sm text-neutral-600">Now serving</div>
                  <div className="mt-1 text-5xl font-bold text-neutral-900">{typeof nowServing === 'number' ? nowServing : '-'}</div>
                </div>
                {typeof data.eta_minutes === 'number' ? (
                  <div className="mt-4 text-sm text-neutral-700">Estimated wait: <span className="font-medium">{data.eta_minutes} min</span></div>
                ) : null}
              </div>
            )}
          </div>
          <p className="mt-4 text-center text-sm text-neutral-600">This page updates automatically as the venue advances the queue.</p>
          <div className="mt-6 flex items-center justify-center">
            <Link href="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/waitq.svg" alt="WaitQ" className="h-4 w-auto" />
              <span className="text-sm">Powered by WaitQ</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}


