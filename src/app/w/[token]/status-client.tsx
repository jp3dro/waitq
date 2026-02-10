"use client";
import { useEffect, useRef, useState } from "react";
import { User, Utensils, Globe, Instagram, Facebook, MapPin, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Entry = { status: string; created_at: string; eta_minutes: number | null; queue_position: number | null; waitlist_id?: string; ticket_number?: number | null; notified_at?: string | null; cancelled_at?: string | null; cancelled_by?: string | null; seating_preference?: string | null; party_size?: number | null };
type Business =
  | {
    name: string | null;
    logo_url: string | null;
    accent_color?: string | null;
    background_color?: string | null;
    website_url?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    google_maps_url?: string | null;
    menu_url?: string | null;
  }
  | null;

export default function ClientStatus({ token }: { token: string }) {
  const router = useRouter();
  const [data, setData] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowServing, setNowServing] = useState<number | null>(null);
  const [aheadCount, setAheadCount] = useState<number | null>(null);
  const [business, setBusiness] = useState<Business>(null);
  const [locationPhone, setLocationPhone] = useState<string | null>(null);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [locationCity, setLocationCity] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [displayToken, setDisplayToken] = useState<string | null>(null);
  const [waitlistName, setWaitlistName] = useState<string | null>(null);
  const [waitlistId, setWaitlistId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [cancelPending, setCancelPending] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const pendingRefreshRef = useRef(false);
  const lastRefreshAtRef = useRef<number>(0);
  const statusChannelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const waitlistChannelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const statusLiveRef = useRef(false);
  const waitlistLiveRef = useRef(false);

  if (!supabaseRef.current) supabaseRef.current = createClient();

  // Public pages: Do not force any theme change to avoid causing logout or cookie issues.
  // The theme will be whatever the user has set in their browser/app.

  async function load(silent: boolean = false) {
    if (!silent && !data) setLoading(true);
    const res = await fetch(`/api/w-status?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    if (!res.ok) {
      // Invalid token or not found. Clear data so redirect logic can handle fallback.
      setData(null);
      setNowServing(null);
      setBusiness(null);
      setLocationPhone(null);
      setLocationAddress(null);
      setDisplayToken(null);
      setWaitlistId(null);
      if (!silent || !data) setLoading(false);
      return;
    }
    const j = await res.json();
    const entry = (j.entry as Entry) || null;
    setData((prev) => ({ ...(prev || entry || null), ...(entry || {}) } as Entry));
    setNowServing(j.nowServing ?? null);
    setAheadCount(typeof j.aheadCount === "number" ? j.aheadCount : null);
    setBusiness(j.business || null);
    setLocationPhone(typeof j.locationPhone === "string" && j.locationPhone.trim().length ? j.locationPhone.trim() : null);
    setLocationAddress(typeof j.locationAddress === "string" && j.locationAddress.trim().length ? j.locationAddress.trim() : null);
    setLocationCity(typeof j.locationCity === "string" && j.locationCity.trim().length ? j.locationCity.trim() : null);
    setLocationName(typeof j.locationName === "string" && j.locationName.trim().length ? j.locationName.trim() : null);
    setDisplayToken((j.displayToken as string | null) || null);
    setWaitlistName((j.waitlistName as string | null) || null);
    setWaitlistId((entry?.waitlist_id as string | undefined) || null);
    setCustomerName((j.customerName as string | null) || null);
    if (!silent || !data) setLoading(false);
  }

  const scheduleRefresh = () => {
    // Debounce bursts (multiple broadcasts can happen per mutation)
    const now = Date.now();
    if (now - lastRefreshAtRef.current < 250) return;
    lastRefreshAtRef.current = now;

    // If tab is hidden, defer the refetch to when the user comes back.
    if (typeof document !== "undefined" && document.hidden) {
      pendingRefreshRef.current = true;
      return;
    }
    if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => {
      load(true);
    }, 60);
  };

  useEffect(() => {
    const supabase = supabaseRef.current!;
    load();

    // Public-safe realtime: we only listen to lightweight broadcast "refresh" events (no payload / no PII).
    const channel = supabase
      .channel(`w-status-${token}`)
      .on("broadcast", { event: "refresh" }, scheduleRefresh)
      .subscribe((status) => {
        // When streaming is unavailable, we'll show the "offline" indicator.
        const ok = status === "SUBSCRIBED";
        statusLiveRef.current = ok;
        setIsLive(statusLiveRef.current || waitlistLiveRef.current);
      });
    statusChannelRef.current = channel;

    const onVisible = () => {
      if (typeof document === "undefined") return;
      if (!document.hidden && pendingRefreshRef.current) {
        pendingRefreshRef.current = false;
        load(true);
      }
    };

    // Make sure we catch up when user returns to the tab/window.
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      try {
        if (statusChannelRef.current) {
          try { supabase.removeChannel(statusChannelRef.current); } catch { }
          statusChannelRef.current = null;
        }
        if (waitlistChannelRef.current) {
          try { supabase.removeChannel(waitlistChannelRef.current); } catch { }
          waitlistChannelRef.current = null;
        }
      } catch { }
      statusLiveRef.current = false;
      waitlistLiveRef.current = false;
      setIsLive(false);
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    };
  }, [token]);

  // Subscribe to waitlist-wide refreshes once we know the waitlist id.
  // This is required so "Now serving" updates for everyone when staff calls a different number.
  useEffect(() => {
    const supabase = supabaseRef.current!;
    if (!waitlistId) return;

    // Don't subscribe if we've already reached a terminal state.
    const status = data?.status;
    if (status === "seated" || status === "cancelled" || status === "archived") return;

    if (waitlistChannelRef.current) {
      try { supabase.removeChannel(waitlistChannelRef.current); } catch { }
      waitlistChannelRef.current = null;
    }
    const ch = supabase
      .channel(`user-wl-${waitlistId}`)
      .on("broadcast", { event: "refresh" }, scheduleRefresh)
      .subscribe((st) => {
        const ok = st === "SUBSCRIBED";
        waitlistLiveRef.current = ok;
        setIsLive(statusLiveRef.current || waitlistLiveRef.current);
      });
    waitlistChannelRef.current = ch;

    return () => {
      try { supabase.removeChannel(ch); } catch { }
      if (waitlistChannelRef.current === ch) waitlistChannelRef.current = null;
      waitlistLiveRef.current = false;
      setIsLive(statusLiveRef.current || waitlistLiveRef.current);
    };
  }, [waitlistId, data?.status]);

  // Accent customization removed: brand is now locked to the preset theme.

  // Stop streaming after terminal state; expiry handling is done via API (410).
  useEffect(() => {
    if (loading) return;
    const isTerminalCheck = (s: string | undefined) => s === "seated" || s === "cancelled" || s === "archived";
    if (!data) {
      router.replace(`/`);
      return;
    }
    if (isTerminalCheck(data?.status)) {
      // stop realtime subscriptions once final
      const supabase = supabaseRef.current!;
      if (statusChannelRef.current) {
        try { supabase.removeChannel(statusChannelRef.current); } catch { }
        statusChannelRef.current = null;
      }
      if (waitlistChannelRef.current) {
        try { supabase.removeChannel(waitlistChannelRef.current); } catch { }
        waitlistChannelRef.current = null;
      }
    }
  }, [loading, data, router]);

  if (loading || !data) return (
    <main className="min-h-dvh bg-background text-foreground flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </main>
  );

  // Apply brand color only in personal status page (public facing)
  // We use the primary color from business settings via server payload (not available here),
  // so we skip dynamic application unless extended in the API. For now, keep theme tokens.

  const isNotified = data.status === "notified";
  const isNoShow = data.status === "archived";
  const isSeated = data.status === "seated";
  const isCancelled = data.status === "cancelled";

  const isUserTurn = isNotified;

  const yourNumber = typeof data.ticket_number === 'number' ? data.ticket_number : (typeof data.queue_position === 'number' ? data.queue_position : null);

  const isTerminal = data.status === "seated" || data.status === "cancelled" || data.status === "archived";
  const terminalLabel =
    data.status === "archived" ? "No show" : data.status === "seated" ? "Show" : data.status === "cancelled" ? "Cancelled" : null;

  const links = [
    { key: "website", label: "Website", url: business?.website_url || "", icon: Globe },
    { key: "instagram", label: "Instagram", url: business?.instagram_url || "", icon: Instagram },
    { key: "facebook", label: "Facebook", url: business?.facebook_url || "", icon: Facebook },
    { key: "google_maps", label: "Google Maps", url: business?.google_maps_url || "", icon: MapPin },
  ].filter((l) => typeof l.url === "string" && l.url.trim().length > 0);

  const telHref = locationPhone ? `tel:${locationPhone.replace(/[^\d+]/g, "")}` : null;
  const initials = (() => {
    const raw = (business?.name || "").trim();
    if (!raw) return "WQ";
    const parts = raw.split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return raw.slice(0, 2).toUpperCase();
  })();

  const cancelReservation = async () => {
    setCancelError(null);
    setCancelPending(true);
    try {
      const res = await fetch("/api/w-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCancelError(j?.error ?? "Unable to cancel ticket");
        return;
      }
      setData((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
      await load(true);
    } finally {
      setCancelPending(false);
    }
  };

  // Now serving indicator for header
  const nowServingDisplay = typeof nowServing === 'number' ? nowServing : null;
  const isClosed = nowServingDisplay === null && !isLive;

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col">
      <div className="flex-1 flex flex-col px-4 py-4">
        <div className="mx-auto w-full max-w-md flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            {waitlistName ? (
              <h1 className="text-xl w-full text-center sm:text-2xl font-bold tracking-tight">{waitlistName}</h1>
            ) : null}
          </div>

          {isCancelled ? (
            <div className="bg-card ring-1 ring-border rounded-xl p-6 text-center">
              <h2 className="text-2xl font-bold text-foreground">
                {data.cancelled_by === "customer" ? "You left the waitlist" : "This ticket is closed"}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {data.cancelled_by === "customer"
                  ? "This ticket is no longer valid because you removed yourself from the waitlist."
                  : "Your ticket has been cancelled."}
              </p>
              {typeof yourNumber === "number" ? (
                <div className="py-6 border-y border-border mt-6">
                  <p className="text-md text-foreground">Your ticket number</p>
                  <div className="mt-2 text-5xl font-extrabold text-foreground">{yourNumber}</div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Flexible Status Banner */}
              <div className={cn(
                "rounded-xl overflow-hidden shadow-sm ring-1 flex items-center mb-6",
                (isClosed || isNoShow)
                  ? "bg-red-50 dark:bg-red-950/20 ring-red-200 dark:ring-red-900/50"
                  : isUserTurn
                    ? "bg-emerald-600 text-white shadow-emerald-200/50 dark:shadow-none ring-emerald-500"
                    : "bg-emerald-50 dark:bg-emerald-950/20 ring-emerald-200 dark:ring-emerald-800/50"
              )}>
                {!isClosed && !isNoShow && !isSeated && (
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 border-r",
                    isUserTurn
                      ? "border-white/20 text-white"
                      : "border-emerald-100 dark:border-emerald-800/50 text-emerald-700"
                  )}>
                    <span className="relative flex h-2.5 w-2.5">
                      {isLive ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-muted-foreground/40"></span>
                      )}
                    </span>
                    <span className="text-3xl font-black tabular-nums tracking-tighter">
                      {nowServingDisplay ?? '-'}
                    </span>
                  </div>
                )}
                <div className="flex-1 px-4 py-3 leading-tight">
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mb-0.5",
                    (isClosed || isNoShow) ? "text-red-600/70" : isUserTurn ? "text-emerald-100" : "text-emerald-600/70"
                  )}>
                    {(isClosed || isNoShow) ? "Status" : isSeated ? "Thank you" : isUserTurn ? "It's your turn" : "Now calling"}
                  </p>
                  <p className={cn(
                    "text-sm font-bold",
                    (isClosed || isNoShow) ? "text-red-700" : isUserTurn ? "text-white" : "text-emerald-700"
                  )}>
                    {isClosed ? "Waitlist Closed" : isNoShow ? "Sorry, your place in the waitlist expired and is no longer valid." : isSeated ? "We hope you enjoyed our service!" : isUserTurn ? "Please head to the restaurant now. Thank you for waiting!" : "Please wait for your turn."}
                  </p>
                </div>
              </div>

              <div className="bg-card ring-1 ring-border rounded-xl p-6 overflow-hidden">
                <div className="grid grid-cols-2 gap-4 items-center">
                  {/* Left Column: Title and Number */}
                  <div className="text-center pr-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Your number
                    </p>
                    <div className="text-5xl sm:text-6xl font-extrabold text-foreground tabular-nums">
                      {typeof yourNumber === 'number' ? yourNumber : '-'}
                    </div>
                  </div>

                  {/* Right Column: Details simplified */}
                  <div className="flex flex-col justify-center gap-4 pl-2">
                    {customerName && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Name</p>
                        <p className="text-sm font-bold text-foreground truncate">{customerName}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-4">
                      {typeof data.party_size === 'number' ? (
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Party</p>
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-bold text-foreground">{data.party_size}</span>
                          </div>
                        </div>
                      ) : null}
                      {data.seating_preference ? (
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Preference</p>
                          <p className="text-sm font-bold text-foreground truncate">{data.seating_preference}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {typeof data.eta_minutes === 'number' && (!(typeof yourNumber === 'number' && typeof nowServing === 'number' && (yourNumber - nowServing <= 1))) ? (
                  <div className="mt-6 rounded-xl bg-muted/50 ring-1 ring-border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Estimated wait time</p>
                    <p className="mt-1 text-xl font-semibold">{data.eta_minutes} min</p>
                  </div>
                ) : null}

                {/* Cancel button below both columns centered */}
                {!isTerminal ? (
                  <div className="mt-8 flex justify-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-foreground h-8 text-sm" disabled={cancelPending}>
                          Remove me from the waitlist
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent showCloseButton={false}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel your reservation?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogBody>
                          <AlertDialogDescription>
                            You&apos;ll be removed from the waitlist. You can rejoin if needed.
                          </AlertDialogDescription>
                        </AlertDialogBody>
                        <AlertDialogFooter>
                          <AlertDialogAction onClick={cancelReservation} disabled={cancelPending}>
                            {cancelPending ? "Removing…" : "Remove me"}
                          </AlertDialogAction>
                          <AlertDialogCancel>Remain in the waitlist</AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {cancelError ? <p className="mt-2 text-xs text-destructive text-center w-full">{cancelError}</p> : null}
                  </div>
                ) : null}
              </div>

              {/* Restaurant Section */}
              {(business?.name || links.length || telHref || locationAddress) ? (
                <div className="bg-muted/50 ring-1 ring-border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center">
                      {business?.logo_url ? (
                        <img src={business.logo_url} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">{initials}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {business?.name ? (
                        <p className="text-sm font-semibold text-foreground">{business.name}</p>
                      ) : null}
                      {locationAddress || locationCity ? (
                        <p className="text-xs text-muted-foreground truncate">
                          {[locationAddress, locationCity].filter(Boolean).join(", ")}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* View Menu Button */}
                  {business?.menu_url && business.menu_url.trim() ? (
                    <a href={business.menu_url.trim()} target="_blank" rel="noopener noreferrer" className="block">
                      <Button size="lg" className="w-full" variant="outline">
                        <Utensils className="w-5 h-5 mr-2" />
                        View Menu
                      </Button>
                    </a>
                  ) : null}

                  {(links.length || telHref) ? (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {links.map((l) => (
                        <a
                          key={l.key}
                          href={l.url.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-background text-foreground ring-1 ring-border rounded-full hover:bg-muted transition-colors"
                        >
                          <l.icon className="w-3.5 h-3.5" />
                          {l.label}
                        </a>
                      ))}
                      {telHref ? (
                        <a
                          href={telHref}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-background text-foreground ring-1 ring-border rounded-full hover:bg-muted transition-colors"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          {locationPhone}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-8 flex items-center justify-center gap-1">
            <span className="text-xs font-medium text-muted-foreground">Powered by</span>
            <img src="/waitq.svg" alt="WaitQ" className="h-4 w-auto logo-light" />
            <img src="/waitq-variant.svg" alt="WaitQ" className="h-4 w-auto logo-dark" />
          </div>
        </div>
      </div>
    </main >
  );
}
