"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { differenceInMinutes } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toastManager } from "@/hooks/use-toast";
import { RefreshCw, Archive, Pencil, Trash2, MoreHorizontal, Copy, Clock, User, MessageSquare, Crown } from "lucide-react";
import { Stepper } from "@/components/ui/stepper";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type Entry = {
  id: string;
  customer_name: string | null;
  phone: string;
  visits_count?: number | null;
  is_returning?: boolean | null;
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

export default function WaitlistTable({ fixedWaitlistId }: { fixedWaitlistId?: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [waitlists, setWaitlists] = useState<{ id: string; name: string; display_token?: string; list_type?: string; seating_preferences?: string[]; ask_name?: boolean; ask_phone?: boolean }[]>([]);
  const [waitlistId, setWaitlistId] = useState<string | null>(fixedWaitlistId ?? null);
  const supabase = createClient();
  const refreshTimer = useRef<number | null>(null);
  const currentList = waitlists.find(w => w.id === waitlistId);
  const showName = currentList?.ask_name !== false;
  const showPhone = currentList?.ask_phone !== false;
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

  const checkIn = (id: string) => {
    startTransition(async () => {
      const res = await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "seated" }),
      });
      if (res.ok) {
        toastManager.add({
          title: "Checked in",
          description: "Customer marked as served",
          type: "success",
        });
        try { window.dispatchEvent(new CustomEvent('wl:refresh', { detail: { waitlistId } })); } catch { }
        await load(true);
      } else {
        toastManager.add({
          title: "Error",
          description: "Failed to check-in customer",
          type: "error",
        });
      }
    });
  };

  const noShow = (id: string) => {
    startTransition(async () => {
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
        try { window.dispatchEvent(new CustomEvent('wl:refresh', { detail: { waitlistId } })); } catch { }
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
        } catch { }
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

  const renderRowMenuItems = (e: Entry) => (
    <>
      <DropdownMenuItem disabled={isPending} onSelect={() => edit(e.id)}>
        <Pencil className="h-4 w-4" />
        Edit
      </DropdownMenuItem>
      {showPhone && (e.sms_status === "failed" || e.whatsapp_status === "failed") ? (
        <>
          {e.sms_status === "failed" ? (
            <DropdownMenuItem disabled={isPending} onSelect={() => retryMessage(e.id, "sms")}>
              <RefreshCw className="h-4 w-4" />
              Retry SMS
            </DropdownMenuItem>
          ) : null}
          {e.whatsapp_status === "failed" ? (
            <DropdownMenuItem disabled={isPending} onSelect={() => retryMessage(e.id, "whatsapp")}>
              <RefreshCw className="h-4 w-4" />
              Retry WhatsApp
            </DropdownMenuItem>
          ) : null}
        </>
      ) : null}
      <DropdownMenuItem disabled={isPending} onSelect={() => archive(e.id)}>
        <Archive className="h-4 w-4" />
        Archive
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        disabled={isPending}
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
    <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl overflow-hidden" ref={tableRef}>
      {/* Mobile (xs/sm): card list */}
      <div className="md:hidden">
        <ul className="divide-y divide-border">
          {entries.map((e) => {
            const number = e.ticket_number ?? e.queue_position ?? null;
            return (
              <li key={e.id} className={highlightIds.has(e.id) ? "row-flash" : ""}>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          #{number ?? "—"}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{getWaitTime(e.created_at)}</span>
                        </div>
                        {e.is_returning ? (
                          <HoverClickTooltip content={loyaltyTooltip(e)} side="bottom" align="start">
                            <button
                              type="button"
                              className="inline-flex items-center"
                              aria-label="Loyalty user"
                              title="Loyalty user"
                            >
                              <Crown className="h-4 w-4 text-orange-500" />
                            </button>
                          </HoverClickTooltip>
                        ) : null}
                      </div>

                      {showName ? (
                        <div className="mt-2 text-sm font-medium truncate">
                          <span className="inline-flex items-center gap-2 min-w-0">
                            <span className="truncate">{e.customer_name ?? "—"}</span>
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
                      {showPhone ? (
                        <div className="mt-0.5 text-sm text-muted-foreground truncate">
                          {e.phone}
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0 inline-flex items-center gap-2">
                      <Button
                        onClick={() => copyPersonalUrl(e.token)}
                        variant="outline"
                        size="icon"
                        title="Copy personal page URL"
                        aria-label="Copy personal page URL"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Open menu">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {renderRowMenuItems(e)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{typeof e.party_size === "number" ? e.party_size : "—"}</span>
                    </div>
                    {e.seating_preference ? <Badge variant="secondary">{e.seating_preference}</Badge> : null}
                    {showPhone ? (
                      <div className="text-xs">
                        {getNotificationDisplay(e.send_sms, e.send_whatsapp, e.sms_status, e.whatsapp_status)}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    {e.status === "waiting" ? (
                      <Button disabled={isPending} onClick={() => call(e.id)} size="sm" className="w-full">
                        Call
                      </Button>
                    ) : null}
                    {e.status === "notified" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          disabled={isPending}
                          onClick={() => checkIn(e.id)}
                          size="sm"
                          className="bg-emerald-500 text-black hover:bg-emerald-500/90"
                        >
                          Check-in
                        </Button>
                        <Button disabled={isPending} onClick={() => noShow(e.id)} size="sm" variant="destructive">
                          No show
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Desktop (md+): table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              <th className="text-left font-medium text-foreground px-4 py-2">Actions</th>
              <th className="text-left font-medium text-foreground px-4 py-2">#</th>
              {showName && <th className="text-left font-medium text-foreground px-4 py-2">Name</th>}
              {showPhone && <th className="text-left font-medium text-foreground px-4 py-2">Phone</th>}
              <th className="text-left font-medium text-foreground px-4 py-2">Party</th>
              <th className="text-left font-medium text-foreground px-4 py-2">Preference</th>
              {showPhone && <th className="text-left font-medium text-foreground px-4 py-2">Alerts</th>}
              <th className="text-left font-medium text-foreground px-4 py-2">Wait time</th>
              <th className="text-left font-medium text-foreground px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className={`border-t border-border hover:bg-muted odd:bg-muted/50 ${highlightIds.has(e.id) ? "row-flash" : ""}`}>
                <td className="px-4 py-2">
                  {e.status === 'waiting' && (
                    <Button disabled={isPending} onClick={() => call(e.id)} size="sm">
                      Call
                    </Button>
                  )}
                  {e.status === 'notified' && (
                    <div className="flex items-center gap-2">
                      <Button
                        disabled={isPending}
                        onClick={() => checkIn(e.id)}
                        size="sm"
                        className="bg-emerald-500 text-black hover:bg-emerald-500/90"
                      >
                        Check-in
                      </Button>
                      <Button disabled={isPending} onClick={() => noShow(e.id)} size="sm" variant="destructive">
                        No show
                      </Button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">{e.ticket_number ?? e.queue_position ?? "-"}</td>
                {showName && (
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span>{e.customer_name ?? "—"}</span>
                        {e.is_returning ? (
                          <HoverClickTooltip content={loyaltyTooltip(e)} side="bottom" align="start">
                            <button
                              type="button"
                              className="inline-flex items-center"
                              aria-label="Loyalty user"
                              title="Loyalty user"
                            >
                              <Crown className="h-4 w-4 text-orange-500" />
                            </button>
                          </HoverClickTooltip>
                        ) : null}
                      </div>
                    </div>
                  </td>
                )}
                {showPhone && <td className="px-4 py-2">{e.phone}</td>}
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{typeof e.party_size === 'number' ? e.party_size : "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  {e.seating_preference ? <Badge variant="secondary">{e.seating_preference}</Badge> : "—"}
                </td>
                {showPhone && (
                  <td className="px-4 py-2">
                    <span className="text-xs">{getNotificationDisplay(e.send_sms, e.send_whatsapp, e.sms_status, e.whatsapp_status)}</span>
                  </td>
                )}
                <td className="px-4 py-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="flex items-center gap-1.5 w-fit cursor-default">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{getWaitTime(e.created_at)}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{new Date(e.created_at).toLocaleString()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      onClick={() => copyPersonalUrl(e.token)}
                      variant="outline"
                      size="icon"
                      title="Copy personal page URL"
                      aria-label="Copy personal page URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Open menu">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {renderRowMenuItems(e)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row actions menu is now implemented with shadcn DropdownMenu */}

      {/* Edit entry */}
      <Dialog open={!!editingId} onOpenChange={(v) => (!v ? setEditingId(null) : undefined)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          <div className="flex max-h-[90vh] flex-col">
            <div className="px-6 pt-6">
              <DialogHeader>
                <DialogTitle>Edit entry</DialogTitle>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <form className="grid gap-4">
                {showName && (
                  <div className="grid gap-2">
                    <Label>Customer name</Label>
                    <Input
                      type="text"
                      value={editForm.customerName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                )}

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
                  {showPhone && (
                    <div className="flex-1 grid gap-2">
                      <Label>Phone</Label>
                      <PhoneInput
                        defaultCountry="PT"
                        value={editForm.phone}
                        onChange={(value) => setEditForm(prev => ({ ...prev, phone: value }))}
                      />
                    </div>
                  )}
                </div>

                {(waitlists.find(w => w.id === waitlistId)?.seating_preferences || []).length > 0 && (
                  <div className="grid gap-2">
                    <Label>Seating preference</Label>
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
            </div>

            <div className="sticky bottom-0 border-t border-border bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <DialogFooter className="p-0">
                <Button type="button" disabled={isPending} onClick={saveEdit}>
                  {isPending ? "Saving…" : "Save changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


