"use client";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeatingPreferenceBadge } from "@/components/ui/seating-preference-badge";
import type { Country } from "@/components/ui/phone-input";
import AddForm from "@/app/(private)/dashboard/waitlist-add-form";
import { User, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";

type Entry = { id: string; ticket_number: number | null; queue_position: number | null; status: string; notified_at?: string | null; party_size?: number | null; seating_preference?: string | null; customer_name?: string | null };
type Payload = { listId: string; listName: string; kioskEnabled?: boolean; displayEnabled?: boolean; showNameOnDisplay?: boolean; showQrOnDisplay?: boolean; locationIsOpen?: boolean; locationStatusReason?: string | null; askName?: boolean; askPhone?: boolean; askEmail?: boolean; businessCountry?: string | null; businessName?: string | null; brandLogo?: string | null; seatingPreferences?: string[]; estimatedMs?: number; entries: Entry[]; accentColor?: string; backgroundColor?: string };

export default function DisplayClient({ token }: { token: string }) {
  const { setTheme } = useTheme();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<number | null>(null);
  const prev = useRef<Payload | null>(null);
  const lastCalledRef = useRef<number | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const pendingRefreshRef = useRef(false);
  const lastRefreshAtRef = useRef<number>(0);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrProviderIndex, setQrProviderIndex] = useState(0);

  if (!supabaseRef.current) supabaseRef.current = createClient();

  // Public pages should follow the user's OS theme by default.
  useEffect(() => {
    setTheme("system");
  }, [setTheme]);

  async function load(silent: boolean = false) {
    if (!silent && !data) setLoading(true);
    const res = await fetch(`/api/display?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    if (!res.ok) {
      if (!silent || !data) setLoading(false);
      setData(null);
      return;
    }
    const j = (await res.json()) as Payload;
    // Ensure consistent order in UI: by ticket_number ascending
    j.entries = (j.entries || []).slice().sort((a, b) => (a.ticket_number ?? 0) - (b.ticket_number ?? 0));
    // Smooth update: preserve previous state to avoid flicker when shape is same
    if (prev.current && j && prev.current.listId === j.listId) {
      setData((cur) => ({ ...(cur || j), ...j }));
    } else {
      setData(j);
    }
    prev.current = j;
    if (!silent || !data) setLoading(false);
  }

  useEffect(() => {
    const supabase = supabaseRef.current!;
    load();

    // Public-safe realtime: we only listen to lightweight broadcast "refresh" events (no row payloads / no PII).
    const channel = supabase
      .channel(`display-bc-${token}`)
      .on("broadcast", { event: "refresh" }, () => {
        // Debounce bursts
        const now = Date.now();
        if (now - lastRefreshAtRef.current < 250) return;
        lastRefreshAtRef.current = now;

        if (typeof document !== "undefined" && document.hidden) {
          pendingRefreshRef.current = true;
          return;
        }
        if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = window.setTimeout(() => {
          load(true);
        }, 60);
      })
      .subscribe();

    const onVisible = () => {
      if (typeof document === "undefined") return;
      if (!document.hidden && pendingRefreshRef.current) {
        pendingRefreshRef.current = false;
        load(true);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      try {
        supabase.removeChannel(channel);
      } catch { }
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [token]);

  // Reset last-called when changing displays
  useEffect(() => {
    lastCalledRef.current = null;
  }, [token]);

  useEffect(() => {
    const enabled = data?.showQrOnDisplay === true;
    if (!enabled) {
      setQrUrl(null);
      setQrProviderIndex(0);
      return;
    }
    const base = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
    // QR codes now point to the dedicated self-check-in page
    const joinUrl = `${base}/join/${encodeURIComponent(token)}`;
    const providers = [
      (t: string) => `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=2&data=${encodeURIComponent(t)}`,
      (t: string) => `https://quickchart.io/qr?size=240&margin=2&text=${encodeURIComponent(t)}`,
      (t: string) => `https://chart.googleapis.com/chart?cht=qr&chs=240x240&chld=L|2&chl=${encodeURIComponent(t)}`,
    ];
    setQrProviderIndex(0);
    setQrUrl(providers[0](joinUrl));
  }, [data?.showQrOnDisplay, token]);

  // NOTE: We subscribe only to broadcast refresh events (no payload), then refetch via /api/display.

  const bg = data?.backgroundColor || "#000000";
  // Accent customization removed: brand is now locked to the preset theme.
  if (loading || !data) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground">{loading ? "Loading…" : "Unable to load this display."}</p>
      </main>
    );
  }

  // Show OFF state when display is disabled
  if (data.displayEnabled === false) {
    return (
      <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <div className="text-center px-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Display is off</h1>
          <p className="mt-2 text-muted-foreground">This public display has been disabled.</p>
        </div>
        <div className="absolute bottom-6 flex items-center justify-center gap-1">
          <span className="text-xs font-medium text-muted-foreground">Powered by</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/waitq.svg" alt="WaitQ" className="h-4 w-auto logo-light" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/waitq-variant.svg" alt="WaitQ" className="h-4 w-auto logo-dark" />
        </div>
      </main>
    );
  }

  const notified = data.entries.filter((e) => e.status === "notified");
  const nowServing = notified.length
    ? notified
      .slice()
      .sort((a, b) => {
        const ad = a.notified_at ? new Date(a.notified_at).getTime() : 0;
        const bd = b.notified_at ? new Date(b.notified_at).getTime() : 0;
        if (ad !== bd) return bd - ad; // latest notified first
        return (b.ticket_number ?? b.queue_position ?? 0) - (a.ticket_number ?? a.queue_position ?? 0);
      })[0]
    : null;

  // Keep "Now serving" stable by persisting the last called number, even if nobody is currently being served.
  const lastCalledEntry =
    data.entries
      .filter((e) => (e.status === "notified" || e.status === "seated") && e.notified_at)
      .slice()
      .sort((a, b) => {
        const ad = a.notified_at ? new Date(a.notified_at).getTime() : 0;
        const bd = b.notified_at ? new Date(b.notified_at).getTime() : 0;
        if (ad !== bd) return bd - ad;
        return (b.ticket_number ?? b.queue_position ?? 0) - (a.ticket_number ?? a.queue_position ?? 0);
      })[0] ?? null;
  const lastCalledNumber = lastCalledEntry ? (lastCalledEntry.ticket_number ?? lastCalledEntry.queue_position ?? null) : null;
  if (typeof lastCalledNumber === "number" && Number.isFinite(lastCalledNumber)) {
    lastCalledRef.current = lastCalledNumber;
  }

  const waiting = data.entries.filter((e) => e.status === "waiting").slice(0, 10);
  const locationIsOpen = data.locationIsOpen !== false;
  const showNameOnDisplay = data.showNameOnDisplay === true;
  const showQrOnDisplay = data.showQrOnDisplay === true;
  const initials = (() => {
    const raw = (data.businessName || "").trim();
    if (!raw) return "WQ";
    const parts = raw.split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return raw.slice(0, 2).toUpperCase();
  })();

  return (
    <main className="h-screen max-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <div className="flex flex-col h-full px-4 py-3 sm:py-4 md:px-6 overflow-hidden">
        {!locationIsOpen ? (
          <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-4 py-2 shrink-0">
            <div className="font-semibold text-sm">Restaurant is closed</div>
            <div className="text-xs opacity-90">{data.locationStatusReason || "This location is currently closed based on regular opening hours."}</div>
          </div>
        ) : null}
        <div className="flex w-full flex-col gap-3 md:flex-row md:flex-wrap md:items-center shrink-0">
          <div className="flex items-center gap-3 md:mr-6 md:flex-1">
            <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center">
              {data.brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.brandLogo} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground">{initials}</span>
              )}
            </div>
            <div className="flex flex-col">
              {data.businessName ? (
                <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-none mb-1">{data.businessName}</p>
              ) : null}
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-none">{data.listName}</h1>
            </div>
          </div>
          {typeof data.estimatedMs === 'number' ? (
            <div className="md:mr-6 flex flex-col md:items-end">
              <p className="w-full text-xs sm:text-sm md:text-right text-muted-foreground">Estimated wait time</p>
              <p className="mt-0.5 text-xl sm:text-2xl font-semibold tracking-tight md:text-right">{formatDuration(data.estimatedMs)}</p>
            </div>
          ) : null}
          {data.kioskEnabled ? (
            <div className="md:ml-auto">
              <KioskButton
                token={token}
                waitlistId={data.listId}
                defaultCountry={data.businessCountry || "PT"}
                seatingPreferences={data.seatingPreferences || []}
                askName={data.askName !== false}
                askPhone={data.askPhone !== false}
                askEmail={data.askEmail === true}
                locationIsOpen={locationIsOpen}
                locationStatusReason={data.locationStatusReason || "Restaurant is closed"}
                disabled={!locationIsOpen}
                disabledReason={data.locationStatusReason || "Restaurant is closed"}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-3 grid md:grid-cols-[1.2fr_1fr] gap-3 md:gap-4 flex-1 min-h-0 overflow-hidden">
          <section className="rounded-2xl bg-card text-card-foreground border border-border flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 border-b border-border shrink-0">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Next in line</h2>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 custom-scrollbar">
              {waiting.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-base">No one waiting at the moment</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {waiting.map((e) => (
                    <li key={e.id} className="py-2.5 sm:py-3 flex items-center gap-3 sm:gap-4">
                      <span className="w-10 sm:w-12 shrink-0 text-left text-2xl sm:text-3xl font-semibold tabular-nums">
                        {e.ticket_number ?? e.queue_position ?? "-"}
                      </span>
                      <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                        {showNameOnDisplay && e.customer_name ? (
                          <div className="text-base font-medium">{e.customer_name}</div>
                        ) : null}
                        {typeof e.party_size === 'number' ? (
                          <div className="flex items-center gap-1 text-base sm:text-lg font-medium">
                            <User className="h-4 w-4" />
                            <span>{e.party_size}</span>
                          </div>
                        ) : null}
                        {e.seating_preference && (
                          <SeatingPreferenceBadge>{e.seating_preference}</SeatingPreferenceBadge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-emerald-50 text-emerald-950 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-50 dark:border-emerald-800 flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 border-b border-emerald-200 dark:border-emerald-800 shrink-0">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Now calling
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 custom-scrollbar">
              {notified.length === 0 ? (
                <div className="text-center py-8 opacity-60">
                  <p className="text-base">Waiting for next group...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {notified.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 sm:gap-6 rounded-xl p-3 sm:p-4 bg-background/50 dark:bg-background/20">
                      <span className="text-4xl sm:text-5xl font-extrabold tabular-nums">
                        {e.ticket_number ?? e.queue_position ?? "-"}
                      </span>
                      <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                        {showNameOnDisplay && e.customer_name ? (
                          <div className="text-lg sm:text-xl font-semibold">{e.customer_name}</div>
                        ) : null}
                        {typeof e.party_size === 'number' ? (
                          <div className="flex items-center gap-1 text-lg sm:text-xl font-medium">
                            <User className="h-5 w-5" />
                            <span>{e.party_size}</span>
                          </div>
                        ) : null}
                        {e.seating_preference && (
                          <SeatingPreferenceBadge>{e.seating_preference}</SeatingPreferenceBadge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-2 flex items-center justify-center shrink-0 gap-1">
          <span className="text-xs font-medium text-muted-foreground">Powered by</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/waitq.svg" alt="WaitQ" className="h-3 w-auto logo-light" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/waitq-variant.svg" alt="WaitQ" className="h-3 w-auto logo-dark" />
        </div>
      </div>

      {/* Floating QR Code - bottom right */}
      {showQrOnDisplay && qrUrl ? (
        <div className="fixed bottom-6 right-6 z-50 hidden md:flex flex-col items-center rounded-2xl bg-card text-card-foreground border border-border shadow-lg p-5">
          <div className="text-base font-semibold text-center leading-snug mb-3">
            Scan to join<br />the waiting list
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="QR code"
            className="h-32 w-32 bg-white rounded-lg"
            onError={() => {
              const providers = [
                (t: string) => `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=2&data=${encodeURIComponent(t)}`,
                (t: string) => `https://quickchart.io/qr?size=240&margin=2&text=${encodeURIComponent(t)}`,
                (t: string) => `https://chart.googleapis.com/chart?cht=qr&chs=240x240&chld=L|2&chl=${encodeURIComponent(t)}`,
              ];
              if (qrProviderIndex < providers.length - 1) {
                const next = qrProviderIndex + 1;
                const base = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
                const joinUrl = `${base}/join/${encodeURIComponent(token)}`;
                setQrProviderIndex(next);
                setQrUrl(providers[next](joinUrl));
              }
            }}
          />
        </div>
      ) : null}
    </main>
  );
}


function KioskButton({
  token,
  waitlistId,
  defaultCountry,
  seatingPreferences,
  askName,
  askPhone,
  askEmail,
  locationIsOpen,
  locationStatusReason,
  disabled,
  disabledReason,
}: {
  token: string;
  waitlistId: string;
  defaultCountry: string;
  seatingPreferences: string[];
  askName: boolean;
  askPhone: boolean;
  askEmail: boolean;
  locationIsOpen: boolean;
  locationStatusReason?: string | null;
  disabled?: boolean;
  disabledReason?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [duplicateDialog, setDuplicateDialog] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  // Track if email was actually provided (not just if askEmail is enabled)
  const [emailProvided, setEmailProvided] = useState(false);
  const [phoneProvided, setPhoneProvided] = useState(false);

  const close = () => {
    setOpen(false);
    setStep("form");
    setTicketNumber(null);
    setEmailProvided(false);
    setPhoneProvided(false);
    setDuplicateDialog({ open: false, message: "" });
  };

  return (
    <>
      <div className="inline-block" title={disabled ? (disabledReason || "Restaurant is closed") : undefined}>
        <Button onClick={() => setOpen(true)} disabled={!!disabled} size="lg" className="h-12 sm:h-14 px-5 sm:px-8 text-base sm:text-xl rounded-xl">
        <Plus className="mr-2 h-5 w-5 sm:h-8 sm:w-8" />
        Add to waiting list
        </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (v) setOpen(true);
          else close();
        }}
      >
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <div className="flex max-h-[90vh] flex-col">
            <div className="min-h-12 h-12 shrink-0 border-b border-border px-6 flex items-center">
              <DialogHeader>
                <DialogTitle className="truncate">{step === "confirm" ? "You're all set!" : "Add to waitlist"}</DialogTitle>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {step === "form" ? (
                <AddForm
                  formId="public-waitlist-form"
                  businessCountry={defaultCountry as Country}
                  lockWaitlist
                  mode="public"
                  publicConfig={{
                    displayToken: token,
                    waitlist: {
                      id: waitlistId,
                      name: "Waitlist",
                      ask_name: askName,
                      ask_phone: askPhone,
                      ask_email: askEmail,
                      seating_preferences: seatingPreferences,
                      location_is_open: locationIsOpen,
                      location_status_reason: locationStatusReason || null,
                    },
                  }}
                  onPublicSuccess={({ ticketNumber, emailProvided: ep, phoneProvided: pp }) => {
                    setTicketNumber(typeof ticketNumber === "number" ? ticketNumber : null);
                    setEmailProvided(ep === true);
                    setPhoneProvided(pp === true);
                    setStep("confirm");
                  }}
                />
              ) : (
                <div className="grid gap-4 text-center text-foreground">
                  {emailProvided ? (
                    <p className="text-sm text-muted-foreground">We sent your ticket details to your email.</p>
                  ) : phoneProvided ? (
                    <p className="text-sm text-muted-foreground">We&apos;ll notify you when your table is ready.</p>
                  ) : null}
                  <div>
                    <p className="text-sm text-muted-foreground">Your ticket</p>
                    <div className="mt-2 text-4xl font-extrabold text-foreground">{ticketNumber ?? "-"}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 min-h-12 h-12 shrink-0 border-t border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center">
              <div className="ml-auto flex items-center gap-2">
                {step === "form" ? (
                  <>
                    <Button type="button" variant="outline" onClick={close}>
                      Cancel
                    </Button>
                    <Button type="submit" form="public-waitlist-form">
                      Add
                    </Button>
                  </>
                ) : (
                  <Button onClick={close}>
                    Done
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={duplicateDialog.open} onOpenChange={(open) => setDuplicateDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Already waiting</AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateDialog.message || "This person is already waiting in this list."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatDuration(ms: number) {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}



// getReadableTextColor removed (using theme-driven shadcn buttons)


