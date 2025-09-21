"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Entry = { status: string; created_at: string; eta_minutes: number | null; queue_position: number | null };

export default function ClientStatus({ token }: { token: string }) {
  const supabase = createClient();
  const [data, setData] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const pollTimer = useRef<number | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("waitlist_entries")
      .select("status, created_at, eta_minutes, queue_position, token")
      .eq("token", token)
      .single();
    setData((data as unknown as Entry) || null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Poll every 2s for near real-time updates (no auth required)
    pollTimer.current = window.setInterval(() => {
      load();
    }, 2000);
    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current);
    };
  }, [token]);

  if (loading || !data) return (
    <main className="p-8">
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-6">
          <p className="text-sm text-neutral-600">Loading…</p>
        </div>
      </div>
    </main>
  );

  return (
    <main className="p-8">
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-6">
          <h1 className="text-xl font-semibold">Your place in line</h1>
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
        </div>
      </div>
    </main>
  );
}


