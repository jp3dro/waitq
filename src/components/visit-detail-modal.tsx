"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { differenceInMinutes } from "date-fns";
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  Phone,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { toastManager } from "@/hooks/use-toast";
import { useTimeFormat } from "@/components/time-format-provider";
import { formatDateTime } from "@/lib/date-time";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { SeatingPreferenceBadge } from "@/components/ui/seating-preference-badge";
import { Stepper } from "@/components/ui/stepper";

export type VisitEntry = {
  id: string;
  waitlist_id?: string | null;
  token?: string | null;

  customer_name: string | null;
  phone: string | null;
  email?: string | null;

  status: string;
  created_at: string;
  notified_at: string | null;
  cancelled_at: string | null;
  updated_at?: string | null;

  // Current-cycle
  ticket_number?: number | null;
  queue_position?: number | null;

  // Optional list-specific fields
  party_size: number | null;
  seating_preference: string | null;

  // Notifications
  send_sms?: boolean | null;
  send_whatsapp?: boolean | null;
  sms_status?: string | null;
  whatsapp_status?: string | null;
};

type ListType = "eat_in" | "take_out";

function getWaitTimeCompact(date: string) {
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
}

function getStatusDisplay(status: string, notifiedAt: string | null) {
  if (status === "seated") {
    return {
      label: "Showed",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    };
  }
  if (status === "cancelled") {
    return {
      label: "Cancelled",
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    };
  }
  if (status === "archived") {
    if (notifiedAt) {
      return {
        label: "No Show",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-950/30",
      };
    }
    return {
      label: "Archived",
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    };
  }
  if (status === "notified") {
    return {
      label: "Called",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    };
  }
  return {
    label: "Waiting",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  };
}

export default function VisitDetailModal({
  visit,
  open,
  onOpenChange,
  listType = "eat_in",
  seatingPreferences = [],
  askName = true,
  askPhone = true,
  askEmail = false,
}: {
  visit: VisitEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listType?: ListType;
  seatingPreferences?: string[];
  askName?: boolean;
  askPhone?: boolean;
  askEmail?: boolean;
}) {
  const timeFormat = useTimeFormat();
  const [busy, setBusy] = useState(false);
  const [optimistic, setOptimistic] = useState<Partial<VisitEntry> | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    partySize: 2 as number | null,
    seatingPreference: "",
  });

  const effectiveVisit = useMemo(() => {
    if (!visit) return null;
    return { ...visit, ...(optimistic || {}) };
  }, [optimistic, visit]);

  const showName = askName !== false;
  const showPhone = askPhone !== false;
  const showEmail = askEmail === true;
  const showPartySize = listType !== "take_out";
  const showSeatingPrefs = listType !== "take_out";

  useEffect(() => {
    if (!open || !visit) return;
    setOptimistic(null);
    setValidationError(null);
    setForm({
      customerName: visit.customer_name || "",
      phone: visit.phone || "",
      email: (visit.email || "") as string,
      partySize: typeof visit.party_size === "number" ? visit.party_size : 2,
      seatingPreference: visit.seating_preference || "",
    });
  }, [open, visit]);

  useEffect(() => {
    if (!open) {
      setOptimistic(null);
      setValidationError(null);
    }
  }, [open]);

  const number = effectiveVisit ? (effectiveVisit.ticket_number ?? effectiveVisit.queue_position ?? null) : null;
  const statusDisplay = useMemo(() => {
    if (!effectiveVisit) return null;
    return getStatusDisplay(effectiveVisit.status, effectiveVisit.notified_at);
  }, [effectiveVisit]);

  const timelineEvents = useMemo(() => {
    if (!effectiveVisit) return [];
    const events: { icon: LucideIcon; label: string; time: string }[] = [
      {
        icon: User,
        label: "Joined waitlist",
        time: formatDateTime(effectiveVisit.created_at, timeFormat),
      },
    ];
    if (effectiveVisit.notified_at) {
      events.push({
        icon: Bell,
        label: "Called",
        time: formatDateTime(effectiveVisit.notified_at, timeFormat),
      });
    }
    const statusChangedAt =
      effectiveVisit.updated_at || effectiveVisit.notified_at || effectiveVisit.cancelled_at || effectiveVisit.created_at;
    if (effectiveVisit.status === "seated") {
      events.push({
        icon: CheckCircle2,
        label: "Checked in",
        time: formatDateTime(statusChangedAt, timeFormat),
      });
    } else if (effectiveVisit.status === "archived" && effectiveVisit.notified_at) {
      events.push({ icon: XCircle, label: "Marked as no-show", time: formatDateTime(statusChangedAt, timeFormat) });
    } else if (effectiveVisit.status === "cancelled") {
      events.push({
        icon: XCircle,
        label: "Cancelled",
        time: effectiveVisit.cancelled_at ? formatDateTime(effectiveVisit.cancelled_at, timeFormat) : "—",
      });
    }
    return events;
  }, [timeFormat, effectiveVisit]);

  if (!visit || !effectiveVisit || !statusDisplay) return null;

  const dispatchRefresh = () => {
    const wlId = (visit.waitlist_id as string | undefined) || undefined;
    if (!wlId) return;
    try {
      window.dispatchEvent(new CustomEvent("wl:refresh", { detail: { waitlistId: wlId } }));
    } catch { }
  };

  const copyPersonalUrl = () => {
    const token = (visit.token as string | undefined) || null;
    if (!token) return;
    const url = `${window.location.origin}/w/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      toastManager.add({ title: "Copied", description: "Customer status link copied", type: "success" });
    });
  };

  const request = async (input: RequestInfo, init?: RequestInit) => {
    const res = await fetch(input, init);
    let body: unknown = null;
    try { body = await res.json(); } catch { }
    if (!res.ok) {
      const msg =
        typeof (body as { error?: unknown } | null)?.error === "string"
          ? String((body as { error?: unknown }).error)
          : "Request failed";
      throw new Error(msg);
    }
    return body;
  };

  const saveChanges = async () => {
    if (busy) return;
    if (showName && !form.customerName.trim()) {
      setValidationError("Customer name is required.");
      nameInputRef.current?.focus?.();
      return;
    }
    if (showPartySize && !(typeof form.partySize === "number" && form.partySize >= 1)) {
      setValidationError("Number of people is required.");
      return;
    }
    setValidationError(null);
    setBusy(true);
    try {
      await request("/api/waitlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: visit.id,
          customer_name: showName ? (form.customerName.trim() || null) : undefined,
          phone: showPhone ? (form.phone.trim() || null) : undefined,
          email: showEmail ? (form.email.trim() || null) : undefined,
          party_size: showPartySize ? (typeof form.partySize === "number" ? form.partySize : null) : undefined,
          seating_preference: showSeatingPrefs ? (form.seatingPreference.trim() || null) : undefined,
        }),
      });
      toastManager.add({ title: "Saved", description: "Visit updated successfully", type: "success" });
      dispatchRefresh();
      onOpenChange(false);
    } catch (e) {
      toastManager.add({ title: "Error", description: e instanceof Error ? e.message : "Failed to save changes", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const doAction = async (kind: "call" | "checkin" | "noshow") => {
    if (busy) return;
    setBusy(true);
    try {
      if (kind === "call") {
        await request("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: visit.id, action: "call" }),
        });
        // Keep modal open on call so staff can immediately check-in / no-show.
        // Also add an activity event immediately (optimistic) while the refetch completes.
        setOptimistic({
          status: "notified",
          notified_at: new Date().toISOString(),
        });
        toastManager.add({ title: "Called", description: "Customer marked as called", type: "success" });
      } else if (kind === "checkin") {
        await request("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: visit.id, status: "seated" }),
        });
      } else if (kind === "noshow") {
        await request("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: visit.id, action: "archive" }),
        });
      }
      dispatchRefresh();
      if (kind !== "call") onOpenChange(false);
    } catch (e) {
      toastManager.add({ title: "Error", description: e instanceof Error ? e.message : "Action failed", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const removeVisit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await request(`/api/waitlist?id=${encodeURIComponent(visit.id)}`, { method: "DELETE" });
      toastManager.add({ title: "Deleted", description: "Visit deleted", type: "success" });
      dispatchRefresh();
      onOpenChange(false);
    } catch (e) {
      toastManager.add({ title: "Error", description: e instanceof Error ? e.message : "Failed to delete", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
        <div className="flex max-h-[90vh] flex-col">
          <div className="min-h-12 h-12 shrink-0 border-b border-border px-6 flex items-center bg-card">
            <DialogHeader>
              <DialogTitle className="truncate">Visit Details</DialogTitle>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-hidden px-6 py-4">
            <div className="grid h-full gap-4 md:grid-cols-3">
              {/* Left panel */}
              <div className="min-h-0 custom-scrollbar space-y-6 md:col-span-2">
                {/* Summary */}
                <div className={`rounded-lg p-4 border border-border ${statusDisplay.bgColor}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        {typeof number === "number" ? (
                          <Badge variant="secondary" className="text-xl py-3 px-3 font-bold border border-border bg-background">
                            #{number}
                          </Badge>
                        ) : null}
                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Waiting for {getWaitTimeCompact(effectiveVisit.created_at)}</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold truncate">
                        {effectiveVisit.customer_name || "Anonymous Customer"}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {effectiveVisit.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            <span className="truncate">{effectiveVisit.phone}</span>
                          </div>
                        ) : null}
                        {effectiveVisit.email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{effectiveVisit.email}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-start gap-2">
                      <Badge className={`${statusDisplay.color} bg-transparent border-0`}>
                        {statusDisplay.label}
                      </Badge>
                      {effectiveVisit.token ? (
                        <Button variant="ghost" size="icon" onClick={copyPersonalUrl} title="Copy status URL" disabled={busy}>
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {effectiveVisit.status === "waiting" ? (
                    <div className="mt-3">
                      <Button className="w-full" disabled={busy} onClick={() => doAction("call")}>
                        Call Customer
                      </Button>
                    </div>
                  ) : null}
                  {effectiveVisit.status === "notified" ? (
                    <div className="mt-3 flex gap-2">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                        disabled={busy}
                        onClick={() => doAction("checkin")}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Check-in
                      </Button>
                      <Button className="flex-1" variant="destructive" disabled={busy} onClick={() => doAction("noshow")}>
                        <X className="h-4 w-4 mr-2" />
                        No Show
                      </Button>
                    </div>
                  ) : null}
                </div>

                {/* Edit fields */}
                <div className="space-y-4">
                  {showName ? (
                    <div className="grid gap-2">
                      <Label>Customer name</Label>
                      <Input
                        type="text"
                        ref={nameInputRef}
                        value={form.customerName}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((p) => ({ ...p, customerName: v }));
                          if (validationError && v.trim().length) setValidationError(null);
                        }}
                        placeholder="Full name"
                      />
                      {validationError && validationError.toLowerCase().includes("name") ? (
                        <p className="text-sm text-destructive">{validationError}</p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {showPartySize ? (
                      <div className="flex-none grid gap-2">
                        <Label>Number of people</Label>
                        <Stepper
                          value={typeof form.partySize === "number" ? form.partySize : undefined}
                          onChange={(value) => {
                            setForm((p) => ({ ...p, partySize: typeof value === "number" ? value : null }));
                            if (validationError && typeof value === "number" && value >= 1) setValidationError(null);
                          }}
                          min={1}
                          max={30}
                        />
                        {validationError && validationError.toLowerCase().includes("people") ? (
                          <p className="text-sm text-destructive">{validationError}</p>
                        ) : null}
                      </div>
                    ) : null}
                    {showPhone ? (
                      <div className="flex-1 grid gap-2">
                        <Label>Phone (optional)</Label>
                        <PhoneInput
                          defaultCountry="PT"
                          value={form.phone}
                          onChange={(value) => setForm((p) => ({ ...p, phone: value }))}
                        />
                      </div>
                    ) : null}
                  </div>

                  {showEmail ? (
                    <div className="grid gap-2">
                      <Label>Email (optional)</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="email@example.com"
                      />
                    </div>
                  ) : null}

                  {showSeatingPrefs ? (
                    <div className="grid gap-2">
                      <Label>Seating preference</Label>
                      {seatingPreferences.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {seatingPreferences.map((s) => {
                            const selected = form.seatingPreference === s;
                            return (
                              <button
                                type="button"
                                key={s}
                                onClick={() => setForm((p) => ({ ...p, seatingPreference: s }))}
                                className={`inline-flex items-center rounded-full px-3 h-8 text-sm ring-1 ring-inset transition ${selected ? "bg-primary text-primary-foreground ring-primary" : "bg-card text-foreground ring-border hover:bg-muted"}`}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <Input
                          type="text"
                          value={form.seatingPreference}
                          onChange={(e) => setForm((p) => ({ ...p, seatingPreference: e.target.value }))}
                          placeholder="e.g. Outside"
                        />
                      )}
                      {form.seatingPreference && seatingPreferences.length === 0 ? (
                        <div className="text-xs text-muted-foreground">
                          Current: <SeatingPreferenceBadge>{form.seatingPreference}</SeatingPreferenceBadge>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {/* Notification Status */}
                {(effectiveVisit.send_sms || effectiveVisit.send_whatsapp) ? (
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    <div className="space-y-1 text-sm">
                      {effectiveVisit.send_sms ? (
                        <div className="flex items-center justify-between">
                          <span>SMS</span>
                          <Badge variant="secondary" className="text-xs">
                            {effectiveVisit.sms_status || "pending"}
                          </Badge>
                        </div>
                      ) : null}
                      {effectiveVisit.send_whatsapp ? (
                        <div className="flex items-center justify-between">
                          <span>WhatsApp</span>
                          <Badge variant="secondary" className="text-xs">
                            {effectiveVisit.whatsapp_status || "pending"}
                          </Badge>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Right panel: Activity log */}
              <aside className="min-h-0 custom-scrollbar md:px-4 md:border-l  md:col-span-1">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Activity</h4>
                  </div>
                  <div className="space-y-1">
                    {timelineEvents.map((event, index) => {
                      const Icon = event.icon;
                      return (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex flex-col items-center">
                            <div className="rounded-full p-1 text-primary">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            {index < timelineEvents.length - 1 ? <div className="w-0.5 h-4 bg-border" /> : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">{event.label}</div>
                            <div className="text-xs text-muted-foreground">{event.time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <div className="sticky bottom-0 min-h-12 h-12 shrink-0 border-t border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between">
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 -ml-2"
              disabled={busy}
              onClick={removeVisit}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="button" onClick={saveChanges} disabled={busy}>
                {busy ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
