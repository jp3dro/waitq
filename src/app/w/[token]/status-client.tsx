"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

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
  const [data, setData] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowServing, setNowServing] = useState<number | null>(null);
  const [business, setBusiness] = useState<Business>(null);
  const [displayToken, setDisplayToken] = useState<string | null>(null);
  const [waitlistName, setWaitlistName] = useState<string | null>(null);
  const [waitlistId, setWaitlistId] = useState<string | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const pendingRefreshRef = useRef(false);
  const lastRefreshAtRef = useRef<number>(0);
  const statusChannelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const waitlistChannelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  if (!supabaseRef.current) supabaseRef.current = createClient();

  async function load(silent: boolean = false) {
    if (!silent && !data) setLoading(true);
    const res = await fetch(`/api/w-status?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    if (!res.ok) {
      // Invalid token or not found. Clear data so redirect logic can handle fallback.
      setData(null);
      setNowServing(null);
      setBusiness(null);
      setDisplayToken(null);
      setWaitlistId(null);
      if (!silent || !data) setLoading(false);
      return;
    }
    const j = await res.json();
    const entry = (j.entry as Entry) || null;
    setData((prev) => ({ ...(prev || entry || null), ...(entry || {}) } as Entry));
    setNowServing(j.nowServing ?? null);
    setBusiness(j.business || null);
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
    const channel = supabase.channel(`w-status-${token}`).on("broadcast", { event: "refresh" }, scheduleRefresh).subscribe();
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
    const ch = supabase.channel(`user-wl-${waitlistId}`).on("broadcast", { event: "refresh" }, scheduleRefresh).subscribe();
    waitlistChannelRef.current = ch;

    return () => {
      try { supabase.removeChannel(ch); } catch { }
      if (waitlistChannelRef.current === ch) waitlistChannelRef.current = null;
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
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 h-14 flex items-center justify-between">
          <span className="font-semibold text-lg tracking-tight">&nbsp;</span>
        </div>
      </header>
      <main className="p-8">
        <div className="max-w-xl mx-auto">
          <div className="rounded-2xl bg-card text-card-foreground ring-1 ring-border shadow-sm p-6">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        </div>
      </main>
    </div>
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
    { key: "website", label: "Website", url: business?.website_url || "" },
    { key: "instagram", label: "Instagram", url: business?.instagram_url || "" },
    { key: "facebook", label: "Facebook", url: business?.facebook_url || "" },
    { key: "google_maps", label: "Google Maps", url: business?.google_maps_url || "" },
  ].filter((l) => typeof l.url === "string" && l.url.trim().length > 0);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card py-4">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {business?.logo_url ? (
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={business.logo_url} alt="Logo" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div className="flex flex-col">
              {business?.name ? (
                <p className="text-sm font-medium text-muted-foreground leading-none mb-1">{business.name}</p>
              ) : null}
              {waitlistName ? (
                <h1 className="text-xl font-bold tracking-tight leading-none">{waitlistName}</h1>
              ) : null}
            </div>
          </div>
          <div>
            <Link href="#" aria-label="Toggle theme" className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-muted">
              {/* We reuse the theme toggle component visuals here: */}
              <span className="sr-only">Toggle theme</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="p-8">
        <div className="max-w-xl mx-auto">
          {business?.menu_url && business.menu_url.trim() ? (
            <div className="mb-6">
              <a href={business.menu_url.trim()} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full" size="lg">View menu</Button>
              </a>
            </div>
          ) : null}

          {isTerminal ? (
            <div className="rounded-2xl ring-1 shadow-sm p-6 bg-card ring-border text-center">
              <h2 className="text-2xl font-bold text-foreground">This ticket is closed</h2>
              <p className="mt-2 text-muted-foreground">
                Your number was called and marked as <span className="font-medium text-foreground">{terminalLabel}</span>.
              </p>
              {typeof yourNumber === "number" ? (
                <div className="mt-6">
                  <div className="text-sm text-muted-foreground">Your number</div>
                  <div className="mt-1 text-6xl font-extrabold text-foreground">{yourNumber}</div>
                </div>
              ) : null}
            </div>
          ) : isUserTurn ? (
            <div className="rounded-2xl ring-1 shadow-sm p-6 bg-accent/10 ring-primary/50 text-center">
              <h2 className="text-2xl font-bold text-primary">It&apos;s your turn!</h2>
              <p className="mt-2 text-foreground">Please proceed to {business?.name || "the venue"}</p>
              {typeof yourNumber === 'number' ? (
                <div className="mt-6">
                  <div className="text-sm text-foreground">Your number</div>
                  <div className="mt-1 text-6xl font-extrabold text-foreground">{yourNumber}</div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl bg-card text-card-foreground ring-1 ring-border shadow-sm p-6 text-center">
                <div className="text-sm text-muted-foreground">Now serving</div>
                <div className="mt-1 text-5xl font-bold text-foreground">{typeof nowServing === 'number' ? nowServing : '-'}</div>
              </div>

              <div className="rounded-2xl bg-card text-card-foreground ring-1 ring-border shadow-sm p-6 text-center">
                {typeof yourNumber === 'number' && typeof nowServing === 'number' && (yourNumber - nowServing === 1) ? (
                  <div className="mb-8 p-4 bg-yellow-100/10 border border-yellow-500/50 rounded-xl">
                    <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-500 mb-1">Almost your turn!</h3>
                    <p className="text-foreground">Please head back to the restaurant.</p>
                  </div>
                ) : null}

                <div className="text-lg font-bold text-foreground">Your number</div>
                <div className="mt-1 text-7xl font-extrabold text-foreground">{typeof yourNumber === 'number' ? yourNumber : '-'}</div>

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
                  <div className="mt-8 text-sm text-foreground">Estimated wait: <span className="font-medium">{data.eta_minutes} min</span></div>
                ) : null}
              </div>
            </div>
          )}

          {links.length ? (
            <div className="mt-6 rounded-2xl bg-card text-card-foreground ring-1 ring-border shadow-sm p-6">
              <div className="text-sm font-medium mb-3">Links</div>
              <div className="grid gap-2">
                {links.map((l) => (
                  <a
                    key={l.key}
                    href={l.url.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-4 text-center text-sm text-muted-foreground">This page updates automatically as the venue advances the queue.</p>
          <div className="mt-6 flex items-center justify-center">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <span className="text-sm">Powered by</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/waitq.svg" alt="WaitQ" className="h-4 w-auto logo-light" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/waitq-variant.svg" alt="WaitQ" className="h-4 w-auto logo-dark" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}


