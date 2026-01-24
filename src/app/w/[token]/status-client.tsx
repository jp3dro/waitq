"use client";
import { useEffect, useRef, useState } from "react";
import { User, Utensils, Globe, Instagram, Facebook, MapPin, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
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

type Entry = { status: string; created_at: string; eta_minutes: number | null; queue_position: number | null; waitlist_id?: string; ticket_number?: number | null; notified_at?: string | null; seating_preference?: string | null; party_size?: number | null };
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
  const { setTheme } = useTheme();
  const [data, setData] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowServing, setNowServing] = useState<number | null>(null);
  const [aheadCount, setAheadCount] = useState<number | null>(null);
  const [business, setBusiness] = useState<Business>(null);
  const [locationPhone, setLocationPhone] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [displayToken, setDisplayToken] = useState<string | null>(null);
  const [waitlistName, setWaitlistName] = useState<string | null>(null);
  const [waitlistId, setWaitlistId] = useState<string | null>(null);
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

  // Public pages should follow the user's OS theme by default.
  useEffect(() => {
    setTheme("system");
  }, [setTheme]);

  async function load(silent: boolean = false) {
    if (!silent && !data) setLoading(true);
    const res = await fetch(`/api/w-status?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    if (!res.ok) {
      // Invalid token or not found. Clear data so redirect logic can handle fallback.
      setData(null);
      setNowServing(null);
      setBusiness(null);
      setLocationPhone(null);
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
    setDisplayToken((j.displayToken as string | null) || null);
    setWaitlistName((j.waitlistName as string | null) || null);
    setWaitlistId((entry?.waitlist_id as string | undefined) || null);
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
    const isTerminal = (s: string | undefined) => s === "seated" || s === "cancelled" || s === "archived";
    if (!data) {
      router.replace(`/`);
      return;
    }
    if (isTerminal(data?.status)) {
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

  const isUserTurn = data.ticket_number !== null && data.ticket_number === nowServing;

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

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col">
      <div className="flex-1 flex flex-col px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-md flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center">
                {business?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={business.logo_url} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">{initials}</span>
                )}
              </div>
              <div className="flex flex-col">
                {business?.name ? (
                  <p className="text-sm font-medium text-muted-foreground leading-none mb-1">{business.name}</p>
                ) : null}
                {waitlistName ? (
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-none">{waitlistName}</h1>
                ) : null}
              </div>
            </div>
            {business?.menu_url && business.menu_url.trim() && !isTerminal ? (
              <a href={business.menu_url.trim()} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="text-xs px-3 py-1.5 sm:text-sm sm:px-4 sm:py-2">
                  <Utensils className="w-4 h-4 mr-2" />
                  Menu
                </Button>
              </a>
            ) : null}
          </div>
          {isTerminal ? (
            <div className="bg-card ring-1 ring-border rounded-xl p-6 text-center">
              <h2 className="text-2xl font-bold text-foreground">This ticket is closed</h2>
              <p className="mt-2 text-muted-foreground">
                Your number was called and marked as <span className="font-medium text-foreground">{terminalLabel}</span>.
              </p>
              {typeof yourNumber === "number" ? (
                <div className="py-6 border-y border-border mt-6">
                  <p className="text-sm text-muted-foreground">Your ticket number</p>
                  <div className="mt-2 text-5xl font-extrabold text-foreground">{yourNumber}</div>
                </div>
              ) : null}
            </div>
          ) : isUserTurn ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-200 dark:ring-emerald-800 rounded-xl p-6 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">It&apos;s your turn!</h2>
              <p className="mt-2 text-foreground">Please proceed to {business?.name || "the venue"}</p>
              {typeof yourNumber === 'number' ? (
                <div className="py-6 border-y border-emerald-200 dark:border-emerald-800 mt-6">
                  <p className="text-sm text-muted-foreground">Your ticket number</p>
                  <div className="mt-2 text-5xl font-extrabold text-foreground">{yourNumber}</div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Almost your turn alert */}
              {typeof yourNumber === 'number' && typeof nowServing === 'number' && (yourNumber - nowServing === 1) ? (
                <div className="rounded-xl border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-200 px-4 py-3">
                  <div className="font-semibold">Almost your turn!</div>
                  <div className="text-sm opacity-90">Please head back to the restaurant.</div>
                </div>
              ) : null}

              {/* Your ticket */}
              <div className="bg-card ring-1 ring-border rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground">Your ticket number</p>
                <div className="mt-2 text-6xl font-extrabold text-foreground">{typeof yourNumber === 'number' ? yourNumber : '-'}</div>

                <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
                  {typeof data.party_size === 'number' ? (
                    <div className="flex items-center gap-1.5 text-lg font-medium">
                      <User className="h-5 w-5" />
                      <span>{data.party_size}</span>
                    </div>
                  ) : null}
                  {data.seating_preference ? (
                    <Badge variant="secondary" className="text-sm px-2.5 py-0.5">{data.seating_preference}</Badge>
                  ) : null}
                </div>

                {typeof data.eta_minutes === 'number' && (!(typeof yourNumber === 'number' && typeof nowServing === 'number' && (yourNumber - nowServing <= 1))) ? (
                  <div className="mt-6 rounded-xl bg-muted/50 ring-1 ring-border p-4">
                    <p className="text-sm text-muted-foreground">Estimated wait time</p>
                    <p className="mt-1 text-2xl font-semibold">{data.eta_minutes} min</p>
                  </div>
                ) : null}
              </div>

              {/* Now serving */}
              <div className="bg-card ring-1 ring-border rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                  <span className="relative flex h-3 w-3">
                    {isLive ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-muted-foreground/40"></span>
                    )}
                  </span>
                  <span className={isLive ? "text-foreground" : "text-muted-foreground"}>Now serving</span>
                </div>
                <div className="mt-2 text-4xl font-bold text-foreground">{typeof nowServing === 'number' ? nowServing : '-'}</div>
                {typeof aheadCount === "number" ? (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {aheadCount === 0 ? "No one ahead of you" : `${aheadCount} ${aheadCount === 1 ? "person" : "people"} ahead of you`}
                  </div>
                ) : null}
              </div>

              {/* Links */}
              {(links.length || telHref) ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {links.map((l) => (
                    <a
                      key={l.key}
                      href={l.url.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-card text-card-foreground ring-1 ring-border rounded-full hover:bg-muted transition-colors"
                    >
                      <l.icon className="w-3.5 h-3.5" />
                      {l.label}
                    </a>
                  ))}
                  {telHref ? (
                    <a
                      href={telHref}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-card text-card-foreground ring-1 ring-border rounded-full hover:bg-muted transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      {locationPhone}
                    </a>
                  ) : null}
                </div>
              ) : null}

              {/* Cancel button */}
              {!isTerminal ? (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={cancelPending}>
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
                  {cancelError ? <p className="text-xs text-destructive">{cancelError}</p> : null}
                </div>
              ) : null}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 flex items-center justify-center gap-1">
            <span className="text-xs font-medium text-muted-foreground">Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/waitq.svg" alt="WaitQ" className="h-4 w-auto logo-light" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/waitq-variant.svg" alt="WaitQ" className="h-4 w-auto logo-dark" />
          </div>
        </div>
      </div>
    </main>
  );
}


