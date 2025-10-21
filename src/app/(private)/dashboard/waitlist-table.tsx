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
  ticket_number?: number | null;
  token: string;
  send_sms?: boolean | null;
  send_whatsapp?: boolean | null;
  party_size?: number | null;
  seating_preference?: string | null;
  sms_message_id?: string | null;
  sms_status?: 'pending' | 'sent' | 'delivered' | 'failed' | null;
  sms_sent_at?: string | null;
  sms_delivered_at?: string | null;
  sms_error_message?: string | null;
  whatsapp_message_id?: string | null;
  whatsapp_status?: 'pending' | 'sent' | 'delivered' | 'failed' | null;
  whatsapp_sent_at?: string | null;
  whatsapp_delivered_at?: string | null;
  whatsapp_error_message?: string | null;
};

export default function WaitlistTable({ fixedWaitlistId }: { fixedWaitlistId?: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [waitlists, setWaitlists] = useState<{ id: string; name: string; display_token?: string }[]>([]);
  const [waitlistId, setWaitlistId] = useState<string | null>(fixedWaitlistId ?? null);
  const supabase = createClient();
  const refreshTimer = useRef<number | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const displayChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  async function load(silent: boolean = false) {
    if (!silent) setLoading(true);
    const url = waitlistId ? `/api/waitlist-list?waitlistId=${encodeURIComponent(waitlistId)}` : "/api/waitlist-list";
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as { entries: Entry[] };

    // Compute new ids for highlight animation
    const incoming = (data.entries || [])
      .filter((e) => e.ticket_number != null)
      .filter((e) => e.status !== "notified");
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
      if (fixedWaitlistId) {
        setWaitlistId(fixedWaitlistId);
      } else if ((j.waitlists || []).length > 0) setWaitlistId(j.waitlists[0].id);
    })();
  }, [fixedWaitlistId]);

  // Listen to local window refresh events (triggered by forms/actions)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { waitlistId?: string } | undefined;
      if (!detail || !waitlistId || (detail.waitlistId && detail.waitlistId !== waitlistId)) return;
      load(true);
    };
    window.addEventListener('wl:refresh', handler as EventListener);
    return () => window.removeEventListener('wl:refresh', handler as EventListener);
  }, [waitlistId]);

  useEffect(() => {
    load(false);
  }, [waitlistId]);

  // Realtime: subscribe to all entries and filter by waitlist_id in client
  useEffect(() => {
    if (!waitlistId) return;
    const channel = supabase
      .channel(`waitlist-entries-${waitlistId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waitlist_entries" },
        (payload: { new?: { waitlist_id?: string }, old?: { waitlist_id?: string } }) => {
          const affectedNew = payload.new?.waitlist_id;
          const affectedOld = payload.old?.waitlist_id;
          if (affectedNew === waitlistId || affectedOld === waitlistId) {
            if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
            refreshTimer.current = window.setTimeout(() => { load(true); }, 60);
          }
        }
      )
      .on("broadcast", { event: "refresh" }, () => {
        if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
        refreshTimer.current = window.setTimeout(() => { load(true); }, 60);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, waitlistId, load]);

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
  }, [supabase, reloadWaitlists]);

  // Manage broadcast channel for current list's display token
  useEffect(() => {
    const token = waitlists.find((w) => w.id === waitlistId)?.display_token;
    if (!token) return;
    if (displayChannelRef.current) {
      supabase.removeChannel(displayChannelRef.current);
      displayChannelRef.current = null;
    }
    const channel = supabase
      .channel(`display-bc-${token}`)
      .subscribe();
    displayChannelRef.current = channel;
    return () => {
      if (displayChannelRef.current) supabase.removeChannel(displayChannelRef.current);
      displayChannelRef.current = null;
    };
  }, [supabase, waitlistId, waitlists]);

  async function reloadWaitlists(selectId?: string) {
    const res = await fetch("/api/waitlists", { cache: "no-store" });
    const j = await res.json();
    setWaitlists(j.waitlists || []);
    if (selectId) setWaitlistId(selectId);
    else if ((j.waitlists || []).length > 0) setWaitlistId(j.waitlists[0].id);
  }

  // Deleting lists is managed in Settings → Lists

  const copyPersonalUrl = (token: string) => {
    const url = `${window.location.origin}/w/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      // Could add a toast here if desired
    });
  };

  const getNotificationDisplay = (
    sendSms?: boolean | null,
    sendWhatsapp?: boolean | null,
    smsStatus?: 'pending' | 'sent' | 'delivered' | 'failed' | null,
    whatsappStatus?: 'pending' | 'sent' | 'delivered' | 'failed' | null
  ) => {
    const methods = [];

    const getStatusIcon = (status: 'pending' | 'sent' | 'delivered' | 'failed' | null) => {
      switch (status) {
        case 'delivered':
          return '✓✓'; // Double check for delivered
        case 'sent':
          return '✓'; // Single check for sent
        case 'pending':
          return '⏳'; // Hourglass for pending
        case 'failed':
          return '✗'; // Cross mark for failed
        default:
          return '…'; // Fallback
      }
    };

    const getStatusColor = (status: 'pending' | 'sent' | 'delivered' | 'failed' | null) => {
      switch (status) {
        case 'delivered':
          return 'text-green-600';
        case 'sent':
          return 'text-blue-600';
        case 'pending':
          return 'text-yellow-600';
        case 'failed':
          return 'text-red-600';
        default:
          return 'text-gray-600';
      }
    };

    // Consider a channel active if it was requested OR if we already have a status for it
    const isSmsActive = !!(sendSms || smsStatus);
    const isWhatsappActive = !!(sendWhatsapp || whatsappStatus);

    if (isSmsActive) {
      methods.push(
        <span key="sms" className={`inline-flex items-center gap-1 ${getStatusColor(smsStatus)}`} title={`SMS: ${smsStatus || 'requested'}`}>
          {getStatusIcon(smsStatus)} SMS
        </span>
      );
    }

    if (isWhatsappActive) {
      methods.push(
        <span key="whatsapp" className={`inline-flex items-center gap-1 ${getStatusColor(whatsappStatus)}`} title={`WhatsApp: ${whatsappStatus || 'requested'}`}>
          {getStatusIcon(whatsappStatus)} WhatsApp
        </span>
      );
    }

    return methods.length > 0 ? methods.reduce((prev, curr, index) => (
      <>
        {prev}
        {index > 0 && <span className="text-gray-400">, </span>}
        {curr}
      </>
    )) : <span className="text-gray-500">None</span>;
  };

  const remove = (id: string) => {
    startTransition(async () => {
      await fetch(`/api/waitlist?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await load(true);
    });
  };

  const retryMessage = (id: string, type: 'sms' | 'whatsapp') => {
    startTransition(async () => {
      const action = type === 'sms' ? 'retry_sms' : 'retry_whatsapp';
      const res = await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      if (res.ok) {
        // Refresh the list to show updated status
        await load(true);
      } else {
        // Could add error handling/toast here
        console.error('Failed to retry message');
      }
    });
  };

  const call = (id: string) => {
    startTransition(async () => {
      const res = await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "call" }),
      });
      if (res.ok) {
        // Local and cross-tab refresh
        try { window.dispatchEvent(new CustomEvent('wl:refresh', { detail: { waitlistId } })); } catch {}
        try {
          // Broadcast to main waitlist table
          const chan1 = supabase.channel(`waitlist-entries-${waitlistId}`);
          await chan1.send({ type: 'broadcast', event: 'refresh', payload: {} });
          supabase.removeChannel(chan1);

          // Broadcast to user status pages
          const chan2 = supabase.channel(`user-wl-${waitlistId}`);
          await chan2.send({ type: 'broadcast', event: 'refresh', payload: {} });
          supabase.removeChannel(chan2);

          // Broadcast to public display if token is available
          const displayToken = waitlists.find((w) => w.id === waitlistId)?.display_token;
          if (displayToken) {
            const chan3 = supabase.channel(`display-bc-${displayToken}`);
            await chan3.send({ type: 'broadcast', event: 'refresh', payload: {} });
            supabase.removeChannel(chan3);
          }
        } catch {}
        await load(true);
      }
    });
  };

  if (loading) return (
    <div className="bg-white ring-1 ring-black/5 rounded-xl p-6">
      <p className="text-sm text-neutral-600">Loading…</p>
    </div>
  );

  if (!loading && entries.length === 0) return (
    <div className="bg-white ring-1 ring-black/5 rounded-xl p-10 text-center">
      <h2 className="text-base font-semibold">No entries yet</h2>
      <p className="mt-1 text-sm text-neutral-600">Add your first guest to start the queue.</p>
    </div>
  );

  return (
    <div className="bg-white ring-1 ring-black/5 rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 sticky top-0 z-10">
            <tr>
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Phone</th>
              <th className="text-left p-2">Party</th>
              <th className="text-left p-2">Seating</th>
              <th className="text-left p-2">Notifications</th>
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className={`border-t hover:bg-neutral-50 ${highlightIds.has(e.id) ? "row-flash" : ""}`}>
                <td className="p-2">{e.ticket_number ?? e.queue_position ?? "-"}</td>
                <td className="p-2">{e.customer_name ?? "—"}</td>
                <td className="p-2">{e.phone}</td>
                <td className="p-2">{typeof e.party_size === 'number' ? e.party_size : "—"}</td>
                <td className="p-2">{e.seating_preference || "—"}</td>
                <td className="p-2">
                  <span className="text-xs">{getNotificationDisplay(e.send_sms, e.send_whatsapp, e.sms_status, e.whatsapp_status)}</span>
                </td>
                <td className="p-2">{new Date(e.created_at).toLocaleString()}</td>
                <td className="p-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => copyPersonalUrl(e.token)}
                      className="inline-flex items-center rounded-md px-2 py-1.5 text-sm font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50"
                      title="Copy personal page URL"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button disabled={isPending} onClick={() => call(e.id)} className="inline-flex items-center rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white shadow-sm disabled:opacity-50">
                      Call
                    </button>
                    <details className="relative">
                      <summary className="list-none inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 cursor-pointer">…</summary>
                      <div className="absolute right-0 mt-1 w-48 rounded-md border bg-white shadow-sm text-sm">
                        {(e.sms_status === 'failed' || e.whatsapp_status === 'failed') && (
                          <>
                            {e.sms_status === 'failed' && (
                              <button
                                disabled={isPending}
                                onClick={() => retryMessage(e.id, 'sms')}
                                className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 text-orange-600 flex items-center gap-2"
                              >
                                <span>🔄</span> Retry SMS
                              </button>
                            )}
                            {e.whatsapp_status === 'failed' && (
                              <button
                                disabled={isPending}
                                onClick={() => retryMessage(e.id, 'whatsapp')}
                                className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 text-orange-600 flex items-center gap-2"
                              >
                                <span>🔄</span> Retry WhatsApp
                              </button>
                            )}
                            <div className="border-t my-1"></div>
                          </>
                        )}
                        <button disabled={isPending} onClick={() => remove(e.id)} className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 text-red-700">Delete</button>
                      </div>
                    </details>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


