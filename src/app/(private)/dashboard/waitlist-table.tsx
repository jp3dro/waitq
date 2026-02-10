"use client";
import { useEffect, useRef, useState } from "react";
import { differenceInMinutes } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toastManager } from "@/hooks/use-toast";
import { RefreshCw, Archive, Pencil, Trash2, MoreHorizontal, Clock, User, MessageSquare, Crown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeatingPreferenceBadge } from "@/components/ui/seating-preference-badge";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { useTimeFormat } from "@/components/time-format-provider";
import { formatDateTime } from "@/lib/date-time";
import VisitDetailModal, { type VisitEntry as VisitDetailEntry } from "@/components/visit-detail-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HoverClickTooltip } from "@/components/ui/hover-click-tooltip";

type Entry = VisitDetailEntry & {
  visits_count?: number | null;
  is_returning?: boolean | null;
  sms_message_id?: string | null;
  sms_sent_at?: string | null;
  sms_delivered_at?: string | null;
  sms_error_message?: string | null;
  whatsapp_message_id?: string | null;
  whatsapp_sent_at?: string | null;
  whatsapp_delivered_at?: string | null;
  whatsapp_error_message?: string | null;
};

const getWaitTime = (date: string) => {
  const start = new Date(date);
  const end = new Date();
  const totalMinutes = differenceInMinutes(end, start);

  if (totalMinutes < 1) return "Just now";

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const None = () => <span className="text-sm text-gray-400">None</span>;

export default function WaitlistTable({ fixedWaitlistId }: { fixedWaitlistId?: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [waitlists, setWaitlists] = useState<{ id: string; name: string; display_token?: string; list_type?: string; seating_preferences?: string[]; ask_name?: boolean; ask_phone?: boolean; ask_email?: boolean }[]>([]);
  const [waitlistId, setWaitlistId] = useState<string | null>(fixedWaitlistId ?? null);
  const supabase = createClient();
  const refreshTimer = useRef<number | null>(null);
  const currentList = waitlists.find(w => w.id === waitlistId);
  const showName = currentList?.ask_name !== false;
  const showPhone = currentList?.ask_phone !== false;
  const showEmail = currentList?.ask_email === true;
  // Important: while `currentList` is loading/refreshing, default to hiding optional columns.
  // This avoids briefly showing eat-in fields (party / seating) on take-out lists.
  const showPartySize = currentList ? currentList.list_type !== "take_out" : false;
  const showSeatingPrefs = currentList ? currentList.list_type !== "take_out" : false;
  const timeFormat = useTimeFormat();
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const displayChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [selectedVisit, setSelectedVisit] = useState<Entry | null>(null);

  // Keep the selected visit in sync with live updates.
  useEffect(() => {
    if (!selectedVisit) return;
    const next = entries.find((e) => e.id === selectedVisit.id) || null;
    if (!next) {
      setSelectedVisit(null);
      return;
    }
    if (next !== selectedVisit) setSelectedVisit(next);
  }, [entries, selectedVisit]);

  const isBusy = (id: string | null | undefined) => {
    if (!id) return false;
    return busyIds.has(id);
  };

  const setBusy = (id: string, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const removeFromListOptimistic = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setHighlightIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateEntryOptimistic = (id: string, patch: Partial<Entry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  async function load(silent: boolean = false) {
    if (!silent) setLoading(true);
    const url = waitlistId ? `/api/waitlist-list?waitlistId=${encodeURIComponent(waitlistId)}` : "/api/waitlist-list";
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as { entries: Entry[] };

    // Compute new ids for highlight animation
    const incoming = (data.entries || [])
      .filter((e) => e.ticket_number != null)
      .filter((e) => e.status !== "archived" && e.status !== "seated" && e.status !== "cancelled");
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
        { event: "*", schema: "public", table: "waitlist_entries", filter: `waitlist_id=eq.${waitlistId}` },
        () => {
          if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
          refreshTimer.current = window.setTimeout(() => { load(true); }, 60);
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
    // Preserve current selection by default.
    // This prevents "list jumping" (e.g. take-out list showing entries from another list)
    // when the waitlists table updates (rename, settings change, etc).
    const fetched = (j.waitlists || []) as { id: string }[];
    const desired =
      fixedWaitlistId ||
      selectId ||
      (waitlistId && fetched.some((w) => w.id === waitlistId) ? waitlistId : null) ||
      (fetched[0]?.id ?? null);
    if (desired) setWaitlistId(desired);
  }

  // Deleting lists is managed in Settings → Lists

  // No-op: legacy dropdown positioning removed in favor of portal menu

  const getNotificationDisplay = (
    sendSms?: boolean | null,
    sendWhatsapp?: boolean | null,
    smsStatus?: 'pending' | 'sent' | 'delivered' | 'failed' | null | undefined,
    whatsappStatus?: 'pending' | 'sent' | 'delivered' | 'failed' | null | undefined
  ) => {
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

    const isNotifiedStatus = (status: 'pending' | 'sent' | 'delivered' | 'failed' | null | undefined) =>
      status === 'sent' || status === 'delivered';

    // Show icons only when a notification was actually sent/delivered.
    const showSms = isNotifiedStatus(smsStatus);
    const showWhatsapp = isNotifiedStatus(whatsappStatus);

    // If nothing actually sent, fall back to showing "None".
    if (!showSms && !showWhatsapp) return <span className="text-gray-500">None</span>;

    return (
      <div className="inline-flex items-center gap-2">
        {showSms ? (
          <span
            className={`inline-flex items-center ${getStatusColor(smsStatus)}`}
            title={`SMS: ${smsStatus}`}
          >
            <MessageSquare className="h-4 w-4" />
          </span>
        ) : null}
        {showWhatsapp ? (
          <span
            className={`inline-flex items-center ${getStatusColor(whatsappStatus)}`}
            title={`WhatsApp: ${whatsappStatus}`}
          >
            <WhatsAppIcon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
    );
  };

  const normalizeDeliveryStatus = (
    v: unknown
  ): 'pending' | 'sent' | 'delivered' | 'failed' | null | undefined => {
    return v === 'pending' || v === 'sent' || v === 'delivered' || v === 'failed'
      ? v
      : (v == null ? (v as null | undefined) : null);
  };

  const archive = (id: string) => {
    if (isBusy(id)) return;
    setBusy(id, true);
    removeFromListOptimistic(id);
    (async () => {
      try {
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
          try { window.dispatchEvent(new CustomEvent('wl:refresh', { detail: { waitlistId } })); } catch { }
          void load(true);
        } else {
          toastManager.add({
            title: "Error",
            description: "Failed to archive customer",
            type: "error",
          });
          void load(true);
        }
      } finally {
        setBusy(id, false);
      }
    })();
  };

  const edit = (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (entry) {
      setSelectedVisit(entry);
    }
  };

  const remove = (id: string) => {
    if (isBusy(id)) return;
    setBusy(id, true);
    removeFromListOptimistic(id);
    (async () => {
      try {
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
        try { window.dispatchEvent(new CustomEvent('wl:refresh', { detail: { waitlistId } })); } catch { }
        void load(true);
      } finally {
        setBusy(id, false);
      }
    })();
  };

  const retryMessage = (id: string, type: 'sms' | 'whatsapp') => {
    if (isBusy(id)) return;
    setBusy(id, true);
    (async () => {
      try {
        const action = type === 'sms' ? 'retry_sms' : 'retry_whatsapp';
        const res = await fetch("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action }),
        });

        if (res.ok) {
          void load(true);
        } else {
          console.error('Failed to retry message');
          void load(true);
        }
      } finally {
        setBusy(id, false);
      }
    })();
  };

  const checkIn = (id: string) => {
    if (isBusy(id)) return;
    setBusy(id, true);
    removeFromListOptimistic(id);
    (async () => {
      try {
        const res = await fetch("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: "seated" }),
        });
        if (res.ok) {
          toastManager.add({
            title: "Checked-in",
            description: "Customer marked as served",
            type: "success",
          });
          try { window.dispatchEvent(new CustomEvent('wl:refresh', { detail: { waitlistId } })); } catch { }
          void load(true);
        } else {
          toastManager.add({
            title: "Error",
            description: "Failed to check-in customer",
            type: "error",
          });
          void load(true);
        }
      } finally {
        setBusy(id, false);
      }
    })();
  };

  const noShow = (id: string) => {
    if (isBusy(id)) return;
    setBusy(id, true);
    removeFromListOptimistic(id);
    (async () => {
      try {
        const res = await fetch("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action: "archive" }),
        });
        if (res.ok) {
          toastManager.add({
            title: "No show",
            description: "Customer archived",
            type: "success",
          });
          try { window.dispatchEvent(new CustomEvent('wl:refresh', { detail: { waitlistId } })); } catch { }
          void load(true);
        } else {
          toastManager.add({
            title: "Error",
            description: "Failed to archive customer",
            type: "error",
          });
          void load(true);
        }
      } finally {
        setBusy(id, false);
      }
    })();
  };

  const call = (id: string) => {
    if (isBusy(id)) return;
    setBusy(id, true);
    updateEntryOptimistic(id, { status: "notified" });
    (async () => {
      try {
        const res = await fetch("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action: "call" }),
        });
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          const channels: string[] = json.notifiedChannels || [];
          let description = "Customer called successfully";
          if (channels.length > 0) {
            const parts = channels.map((c: string) => c === "sms" ? "SMS" : c === "email" ? "e-mail" : c);
            description += `. ${parts.length === 1 ? `An ${parts[0]} has` : `An ${parts.join(" and ")} have`} been sent to this customer`;
          }
          toastManager.add({
            title: "Success",
            description,
            type: "success",
          });
          try { window.dispatchEvent(new CustomEvent('wl:refresh', { detail: { waitlistId } })); } catch { }
          void load(true);
        } else {
          toastManager.add({
            title: "Error",
            description: "Failed to call customer",
            type: "error",
          });
          void load(true);
        }
      } finally {
        setBusy(id, false);
      }
    })();
  };

  const renderContent = () => {
    if (loading) return (
      <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );

    if (entries.length === 0) return (
      <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-10 text-center">
        <h2 className="text-base font-semibold">No entries yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add your first guest to start the queue.</p>
      </div>
    );

    return (
      <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl overflow-hidden w-full min-w-0" ref={tableRef}>
        {/* Mobile (xs/sm): card list */}
        <div className="md:hidden">
          <ul className="divide-y divide-border">
            {entries.map((e) => {
              const number = e.ticket_number ?? e.queue_position ?? null;
              return (
                <li key={e.id} className={`${highlightIds.has(e.id) ? "row-flash" : ""} cursor-pointer hover:bg-muted/50 transition-colors`} onClick={() => edit(e.id)}>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            #{number ?? <None />}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{getWaitTime(e.created_at)}</span>
                          </div>
                        </div>

                        {showName ? (
                          <div className="mt-2 text-sm font-medium truncate">
                            <span className="inline-flex items-center gap-2 min-w-0">
                              <span className="truncate">{e.customer_name ?? <None />}</span>
                              {e.is_returning ? (
                                <HoverClickTooltip content={loyaltyTooltip(e)} side="bottom" align="start">
                                  <button
                                    type="button"
                                    className="inline-flex items-center shrink-0"
                                    aria-label="Loyalty user"
                                    title="Loyalty user"
                                  >
                                    <Crown className="h-4 w-4 text-orange-500" />
                                  </button>
                                </HoverClickTooltip>
                              ) : null}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="shrink-0">
                        {e.status === 'waiting' && (
                          <Button
                            disabled={isBusy(e.id)}
                            onClick={(event) => { event.stopPropagation(); call(e.id); }}
                            size="sm"
                          >
                            Call
                          </Button>
                        )}
                        {e.status === 'notified' && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              className="h-9 w-9 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm"
                              disabled={isBusy(e.id)}
                              onClick={(event) => { event.stopPropagation(); checkIn(e.id); }}
                            >
                              <Check className="h-5 w-5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-9 w-9 shadow-sm border-0"
                              disabled={isBusy(e.id)}
                              onClick={(event) => { event.stopPropagation(); noShow(e.id); }}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      {showPartySize && (
                        <div className="inline-flex items-center gap-1.5 text-sm">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{typeof e.party_size === "number" ? e.party_size : <None />}</span>
                        </div>
                      )}
                      {showSeatingPrefs && (e.seating_preference ? <SeatingPreferenceBadge>{e.seating_preference}</SeatingPreferenceBadge> : <span className="text-xs ml-1"><None /></span>)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Desktop (md+): table */}
        <div className="hidden md:block overflow-x-auto w-full min-w-0">
          <table className="w-full text-sm table-fixed border-separate border-spacing-0">
            <colgroup>
              <col className="w-[80px]" />{/* Number */}
              <col className="w-[100px]" />{/* Actions */}
              {showPartySize && <col className="w-[60px]" />}{/* Party */}
              {showSeatingPrefs && <col className="w-[150px]" />}{/* Preference */}
              <col className="w-auto" />{/* Name */}
              <col className="w-[120px]" />{/* Wait time */}
              {showPhone && <col className="w-[80px]" />}{/* Alerts */}
            </colgroup>
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="text-left font-medium text-foreground px-4 py-2">Number</th>
                <th className="text-left font-medium text-foreground px-4 py-2">Actions</th>
                {showPartySize && <th className="text-left font-medium text-foreground px-4 py-2">Party</th>}
                {showSeatingPrefs && <th className="text-left font-medium text-foreground px-4 py-2">Preference</th>}
                {showName && <th className="text-left font-medium text-foreground px-4 py-2">Name</th>}
                <th className="text-left font-medium text-foreground px-4 py-2">Wait time</th>
                {showPhone && <th className="text-left font-medium text-foreground px-4 py-2">Alerts</th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  className={`border-t border-border hover:bg-muted odd:bg-muted/50 cursor-pointer transition-colors ${highlightIds.has(e.id) ? "row-flash" : ""}`}
                  onClick={() => edit(e.id)}
                >
                  <td className="px-4 py-2 font-bold text-xl">{e.ticket_number ?? e.queue_position ?? <None />}</td>
                  <td className="px-4 py-2">
                    {e.status === 'waiting' && (
                      <Button
                        disabled={isBusy(e.id)}
                        onClick={(event) => { event.stopPropagation(); call(e.id); }}
                        size="sm"
                        className="h-8"
                      >
                        Call
                      </Button>
                    )}
                    {e.status === 'notified' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm"
                          disabled={isBusy(e.id)}
                          onClick={(event) => { event.stopPropagation(); checkIn(e.id); }}
                          title="Check-in"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8 shadow-sm border-0"
                          disabled={isBusy(e.id)}
                          onClick={(event) => { event.stopPropagation(); noShow(e.id); }}
                          title="No show"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                  {showPartySize && (
                    <td className="px-4 py-2">
                      <div className="flex items-center align-left gap-1.5 min-w-0">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{typeof e.party_size === 'number' ? e.party_size : <None />}</span>
                      </div>
                    </td>
                  )}
                  {showSeatingPrefs && (
                    <td className="px-4 py-2 truncate">
                      {e.seating_preference ? (
                        <SeatingPreferenceBadge className="max-w-full">
                          <span className="truncate">{e.seating_preference}</span>
                        </SeatingPreferenceBadge>
                      ) : <None />}
                    </td>
                  )}
                  {showName && (
                    <td className="px-4 py-2 min-w-0">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{e.customer_name ?? <None />}</span>
                          {e.is_returning ? (
                            <HoverClickTooltip content={loyaltyTooltip(e)} side="bottom" align="start">
                              <button
                                type="button"
                                className="inline-flex items-center shrink-0"
                                aria-label="Loyalty user"
                                title="Loyalty user"
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                <Crown className="h-4 w-4 text-orange-500" />
                              </button>
                            </HoverClickTooltip>
                          ) : null}
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="flex items-center gap-1.5 w-fit cursor-default" onClick={(ev) => ev.stopPropagation()}>
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{getWaitTime(e.created_at)}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{formatDateTime(e.created_at, timeFormat)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  {showPhone && (
                    <td className="px-4 py-2">
                      <span className="text-xs">
                        {getNotificationDisplay(
                          e.send_sms,
                          e.send_whatsapp,
                          normalizeDeliveryStatus(e.sms_status),
                          normalizeDeliveryStatus(e.whatsapp_status)
                        )}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRowMenuItems = (e: Entry) => (
    <>
      <DropdownMenuItem disabled={isBusy(e.id)} onSelect={() => edit(e.id)}>
        <Pencil className="h-4 w-4" />
        Edit
      </DropdownMenuItem>
      {showPhone && (e.sms_status === "failed" || e.whatsapp_status === "failed") ? (
        <>
          {e.sms_status === "failed" ? (
            <DropdownMenuItem disabled={isBusy(e.id)} onSelect={() => retryMessage(e.id, "sms")}>
              <RefreshCw className="h-4 w-4" />
              Retry SMS
            </DropdownMenuItem>
          ) : null}
          {e.whatsapp_status === "failed" ? (
            <DropdownMenuItem disabled={isBusy(e.id)} onSelect={() => retryMessage(e.id, "whatsapp")}>
              <RefreshCw className="h-4 w-4" />
              Retry WhatsApp
            </DropdownMenuItem>
          ) : null}
        </>
      ) : null}
      <DropdownMenuItem disabled={isBusy(e.id)} onSelect={() => archive(e.id)}>
        <Archive className="h-4 w-4" />
        Archive
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        disabled={isBusy(e.id)}
        onSelect={() => remove(e.id)}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </>
  );

  const loyaltyTooltip = (e: Entry) => {
    const total = typeof e.visits_count === "number" ? e.visits_count : null;
    const prior = total !== null ? Math.max(0, total - 1) : null;
    return (
      <div className="space-y-1">
        <div className="font-medium">Loyalty user</div>
        <div className="text-xs opacity-90">
          Returning visitor{prior !== null ? ` • ${prior} prior check-in${prior === 1 ? "" : "s"}` : ""}
        </div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}

      <VisitDetailModal
        visit={selectedVisit}
        open={!!selectedVisit}
        onOpenChange={(open) => !open && setSelectedVisit(null)}
        listType={(currentList?.list_type === "take_out" || currentList?.list_type === "eat_in") ? currentList.list_type : "eat_in"}
        seatingPreferences={currentList?.seating_preferences || []}
        askName={currentList?.ask_name !== false}
        askPhone={currentList?.ask_phone !== false}
        askEmail={currentList?.ask_email === true}
      />
    </>
  );
}


