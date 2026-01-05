"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

type Entry = { status: string; created_at: string; eta_minutes: number | null; queue_position: number | null; waitlist_id?: string; ticket_number?: number | null; notified_at?: string | null; seating_preference?: string | null; party_size?: number | null };
type Business = { name: string | null; logo_url: string | null; accent_color?: string | null; background_color?: string | null } | null;

export default function ClientStatus({ token }: { token: string }) {
  const router = useRouter();
  const [data, setData] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const pollTimer = useRef<number | null>(null);
  const [nowServing, setNowServing] = useState<number | null>(null);
  const [business, setBusiness] = useState<Business>(null);
  const [displayToken, setDisplayToken] = useState<string | null>(null);
  const [waitlistName, setWaitlistName] = useState<string | null>(null);

  async function load(silent: boolean = false) {
    if (!silent && !data) setLoading(true);
    const res = await fetch(`/api/w-status?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    if (!res.ok) {
      // Invalid token or not found. Clear data so redirect logic can handle fallback.
      setData(null);
      setNowServing(null);
      setBusiness(null);
      setDisplayToken(null);
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
    if (!silent || !data) setLoading(false);
  }

  useEffect(() => {
    load();
    // Polling is intentional: public pages should not subscribe directly to `waitlist_entries`,
    // to avoid accidental PII exposure via Realtime payloads.
    pollTimer.current = window.setInterval(() => {
      load(true);
    }, 2000);
    return () => {
      const id = pollTimer.current;
      if (id) window.clearInterval(id);
    };
  }, [token]);

  // Accent customization removed: brand is now locked to the preset theme.

  // Redirect to public display for invalid/expired sessions:
  // Conditions: missing entry; or status is one of terminal states; or entry created before today.
  useEffect(() => {
    if (loading) return;
    const isTerminal = (s: string | undefined) => s === "seated" || s === "cancelled" || s === "archived";
    const createdAt = data?.created_at ? new Date(data.created_at) : null;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const isOld = createdAt ? createdAt < startOfToday : false;
    const hasDisplay = typeof displayToken === 'string' && displayToken.length > 0;
    if ((!data || isTerminal(data?.status) || isOld) && hasDisplay) {
      router.replace(`/display/${encodeURIComponent(displayToken as string)}`);
    } else if (!data && !hasDisplay) {
      // Fallback if we cannot resolve a display token (e.g., invalid entry token)
      router.replace(`/`);
    }
  }, [loading, data, displayToken, router]);

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
          {isUserTurn ? (
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


