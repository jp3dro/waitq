"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/modal";
import { createPortal } from "react-dom";
import { toastManager } from "@/hooks/use-toast";
import { RefreshCw, Archive, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Stepper } from "@/components/ui/stepper";
import PhoneInput from "react-phone-number-input";
import 'react-phone-number-input/style.css';
import type { Country } from "react-phone-number-input";

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
  const [waitlists, setWaitlists] = useState<{ id: string; name: string; display_token?: string; list_type?: string; seating_preferences?: string[] }[]>([]);
  const [waitlistId, setWaitlistId] = useState<string | null>(fixedWaitlistId ?? null);
  const supabase = createClient();
  const refreshTimer = useRef<number | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const displayChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    phone: "",
    partySize: "",
    seatingPreference: ""
  });
  const [menuState, setMenuState] = useState<{ entryId: string; top: number; left: number } | null>(null);

  const openMenuFor = (entryId: string, trigger: HTMLElement) => {
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 200;
    const estHeight = 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = rect.left;
    let top = rect.bottom + 4;
    if (left + menuWidth > vw - 8) left = Math.max(8, rect.right - menuWidth);
    if (top + estHeight > vh - 8 && rect.top - estHeight > 8) top = Math.max(8, rect.top - estHeight - 4);
    setMenuState({ entryId, top, left });
  };

  const closeMenu = () => setMenuState(null);

  async function load(silent: boolean = false) {
    if (!silent) setLoading(true);
    const url = waitlistId ? `/api/waitlist-list?waitlistId=${encodeURIComponent(waitlistId)}` : "/api/waitlist-list";
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as { entries: Entry[] };

    // Compute new ids for highlight animation
    const incoming = (data.entries || [])
      .filter((e) => e.ticket_number != null)
      .filter((e) => e.status !== "notified" && e.status !== "archived");
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

  useEffect(() => {
    if (!menuState) return;
    const onClose = () => setMenuState(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuState(null); };
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuState]);

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

  // No-op: legacy dropdown positioning removed in favor of portal menu

  const getNotificationDisplay = (
    sendSms?: boolean | null,
    sendWhatsapp?: boolean | null,
    smsStatus?: 'pending' | 'sent' | 'delivered' | 'failed' | null | undefined,
    whatsappStatus?: 'pending' | 'sent' | 'delivered' | 'failed' | null | undefined
  ) => {
    const methods = [];

    const getStatusIcon = (status: 'pending' | 'sent' | 'delivered' | 'failed' | null | undefined) => {
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

    const getStatusColor = (status: 'pending' | 'sent' | 'delivered' | 'failed' | null | undefined) => {
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

  const archive = (id: string) => {
    startTransition(async () => {
      const res = await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "archive" }),
      });
      if (res.ok) {
        toastManager.add({
          title: "Success",
          description: "Customer archived successfully",
          type: "success",
        });
        await load(true);
      } else {
        toastManager.add({
          title: "Error",
          description: "Failed to archive customer",
          type: "error",
        });
      }
    });
  };

  const edit = (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (entry) {
      setEditForm({
        customerName: entry.customer_name || "",
        phone: entry.phone || "",
        partySize: entry.party_size?.toString() || "",
        seatingPreference: entry.seating_preference || ""
      });
      setEditingId(id);
    }
  };

  const saveEdit = () => {
    if (!editingId) return;

    startTransition(async () => {
      const payload: any = {
        id: editingId,
      };

      // Handle empty strings as null for database
      payload.customer_name = editForm.customerName.trim() || null;
      payload.phone = editForm.phone.trim() || null;
      payload.party_size = editForm.partySize ? parseInt(editForm.partySize, 10) : null;
      payload.seating_preference = editForm.seatingPreference.trim() || null;

      const res = await fetch("/api/waitlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toastManager.add({
          title: "Success",
          description: "Customer updated successfully",
          type: "success",
        });
        setEditingId(null);
        await load(true);
      } else {
        toastManager.add({
          title: "Error",
          description: "Failed to update customer",
          type: "error",
        });
      }
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/waitlist?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        toastManager.add({
          title: "Success",
          description: "Customer removed from waitlist",
          type: "success",
        });
      } else {
        toastManager.add({
          title: "Error",
          description: "Failed to remove customer",
          type: "error",
        });
      }
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
        toastManager.add({
          title: "Success",
          description: "Customer called successfully",
          type: "success",
        });
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
      } else {
        toastManager.add({
          title: "Error",
          description: "Failed to call customer",
          type: "error",
        });
      }
    });
  };

  if (loading) return (
    <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );

  if (!loading && entries.length === 0) return (
    <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-10 text-center">
      <h2 className="text-base font-semibold">No entries yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">Add your first guest to start the queue.</p>
    </div>
  );

  return (
    <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl overflow-hidden" ref={tableRef}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              <th className="text-left font-medium text-foreground px-4 py-2">#</th>
              <th className="text-left font-medium text-foreground px-4 py-2">Name</th>
              <th className="text-left font-medium text-foreground px-4 py-2">Phone</th>
              <th className="text-left font-medium text-foreground px-4 py-2">Party</th>
              <th className="text-left font-medium text-foreground px-4 py-2">Seating</th>
              <th className="text-left font-medium text-foreground px-4 py-2">Notifications</th>
              <th className="text-left font-medium text-foreground px-4 py-2">Created</th>
              <th className="text-left font-medium text-foreground px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className={`border-t border-border hover:bg-muted odd:bg-muted/50 ${highlightIds.has(e.id) ? "row-flash" : ""}`}>
                <td className="px-4 py-2">{e.ticket_number ?? e.queue_position ?? "-"}</td>
                <td className="px-4 py-2">{e.customer_name ?? "—"}</td>
                <td className="px-4 py-2">{e.phone}</td>
                <td className="px-4 py-2">{typeof e.party_size === 'number' ? e.party_size : "—"}</td>
                <td className="px-4 py-2">{e.seating_preference || "—"}</td>
                <td className="px-4 py-2">
                  <span className="text-xs">{getNotificationDisplay(e.send_sms, e.send_whatsapp, e.sms_status, e.whatsapp_status)}</span>
                </td>
                <td className="px-4 py-2">{new Date(e.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => copyPersonalUrl(e.token)}
                      className="action-btn px-2 py-1.5"
                      title="Copy personal page URL"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button disabled={isPending} onClick={() => call(e.id)} className="action-btn action-btn--primary disabled:opacity-50">
                      Call
                    </button>
                    <button
                      onClick={(ev) => openMenuFor(e.id, ev.currentTarget as HTMLElement)}
                      className="menu-trigger"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {menuState && (() => {
        const me = entries.find(x => x.id === menuState.entryId);
        if (!me) return null;
        return createPortal(
          <div className="fixed inset-0 z-50" onClick={closeMenu}>
            <div
              className="absolute menu-container"
              style={{ top: menuState.top, left: menuState.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <button disabled={isPending} onClick={() => { closeMenu(); edit(me.id); }} className="menu-item">
                <Pencil className="menu-icon" />
                <span>Edit</span>
              </button>
              {(me.sms_status === 'failed' || me.whatsapp_status === 'failed') && (
                <>
                  {me.sms_status === 'failed' && (
                    <button
                      disabled={isPending}
                      onClick={() => { closeMenu(); retryMessage(me.id, 'sms'); }}
                      className="menu-item"
                    >
                      <RefreshCw className="menu-icon" />
                      <span>Retry SMS</span>
                    </button>
                  )}
                  {me.whatsapp_status === 'failed' && (
                    <button
                      disabled={isPending}
                      onClick={() => { closeMenu(); retryMessage(me.id, 'whatsapp'); }}
                      className="menu-item"
                    >
                      <RefreshCw className="menu-icon" />
                      <span>Retry WhatsApp</span>
                    </button>
                  )}
                </>
              )}
              <button disabled={isPending} onClick={() => { closeMenu(); archive(me.id); }} className="menu-item">
                <Archive className="menu-icon" />
                <span>Archive</span>
              </button>
              <div className="menu-separator"></div>
              <button disabled={isPending} onClick={() => { closeMenu(); remove(me.id); }} className="menu-item menu-item--danger">
                <Trash2 className="menu-icon" />
                <span>Delete</span>
              </button>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Edit Modal */}
      <Modal
        open={!!editingId}
        onClose={() => setEditingId(null)}
        title="Edit Entry"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="action-btn"
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              onClick={saveEdit}
              className="action-btn action-btn--primary disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </>
        }
      >
        <form className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Customer name</label>
            <input
              type="text"
              value={editForm.customerName}
              onChange={(e) => setEditForm(prev => ({ ...prev, customerName: e.target.value }))}
              className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
              placeholder="Full name"
            />
          </div>

          {(waitlists.find(w => w.id === waitlistId)?.list_type || "restaurants") === "restaurants" ? (
            <div className="flex gap-6">
              <div className="flex-none grid gap-2">
                <label className="text-sm font-medium">Number of people</label>
                <Stepper
                  value={editForm.partySize ? parseInt(editForm.partySize, 10) : undefined}
                  onChange={(value) => setEditForm(prev => ({ ...prev, partySize: value?.toString() || "" }))}
                  min={1}
                  max={20}
                />
              </div>
              <div className="flex-1 grid gap-2">
                <label className="text-sm font-medium">Phone</label>
                <PhoneInput
                  international
                  defaultCountry="PT"
                  value={editForm.phone}
                  onChange={(value) => setEditForm(prev => ({ ...prev, phone: value || "" }))}
                  className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Phone</label>
              <PhoneInput
                international
                defaultCountry="PT"
                value={editForm.phone}
                onChange={(value) => setEditForm(prev => ({ ...prev, phone: value || "" }))}
                className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
              />
            </div>
          )}

          {(waitlists.find(w => w.id === waitlistId)?.seating_preferences || []).length > 0 && (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Seating preference</label>
              <div className="flex flex-wrap gap-2">
                {(waitlists.find(w => w.id === waitlistId)?.seating_preferences || []).map((s) => {
                  const selected = editForm.seatingPreference === s;
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setEditForm(prev => ({ ...prev, seatingPreference: s }))}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs ring-1 ring-inset transition ${selected ? "bg-primary text-primary-foreground ring-primary" : "bg-card text-foreground ring-border hover:bg-muted"}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}


