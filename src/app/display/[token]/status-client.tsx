"use client";
import { useEffect, useRef, useState, useTransition } from "react";
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
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PhoneInput, { type Country } from "react-phone-number-input";
import 'react-phone-number-input/style.css';
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
  const [phoneError, setPhoneError] = useState<string | null>(null);
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
    const displayUrl = `${base}/display/${encodeURIComponent(token)}`;
    const providers = [
      (t: string) => `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=2&data=${encodeURIComponent(t)}`,
      (t: string) => `https://quickchart.io/qr?size=240&margin=2&text=${encodeURIComponent(t)}`,
      (t: string) => `https://chart.googleapis.com/chart?cht=qr&chs=240x240&chld=L|2&chl=${encodeURIComponent(t)}`,
    ];
    setQrProviderIndex(0);
    setQrUrl(providers[0](displayUrl));
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

  const nowServingNumber = nowServing?.ticket_number ?? nowServing?.queue_position ?? lastCalledRef.current ?? null;
  const waiting = data.entries.filter((e) => e.status === "waiting").slice(0, 10);
  const locationIsOpen = data.locationIsOpen !== false;
  const showNameOnDisplay = data.showNameOnDisplay === true;
  const showQrOnDisplay = data.showQrOnDisplay === true;

  return (
    <main className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <div className="flex flex-col flex-1 px-4 py-5 sm:px-6 sm:py-8 md:px-10 overflow-hidden">
        {!locationIsOpen ? (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3">
            <div className="font-semibold">Restaurant is closed</div>
            <div className="text-sm opacity-90">{data.locationStatusReason || "This location is currently closed based on regular opening hours."}</div>
          </div>
        ) : null}
        <div className="flex w-full flex-col gap-4 md:flex-row md:flex-wrap md:items-center shrink-0">
          <div className="flex items-center gap-3 md:mr-6 md:flex-1">
            {data.brandLogo ? (
              <div className="h-10 w-10 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.brandLogo} alt="Logo" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div className="flex flex-col">
              {data.businessName ? (
                <p className="text-sm font-medium text-muted-foreground leading-none mb-2">{data.businessName}</p>
              ) : null}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-none">{data.listName}</h1>
            </div>
          </div>
          {typeof data.estimatedMs === 'number' ? (
            <div className="md:mr-6 flex flex-col md:items-end">
              <p className="w-full text-sm md:text-right text-muted-foreground">Estimated wait time</p>
              <p className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight md:text-right">{formatDuration(data.estimatedMs)}</p>
            </div>
          ) : null}
          {data.kioskEnabled ? (
            <div className="md:ml-auto">
              <KioskButton
                token={token}
                defaultCountry={data.businessCountry || "PT"}
                seatingPreferences={data.seatingPreferences || []}
                askName={data.askName !== false}
                askPhone={data.askPhone !== false}
                askEmail={data.askEmail === true}
                disabled={!locationIsOpen}
                disabledReason={data.locationStatusReason || "Restaurant is closed"}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-6 sm:mt-8 grid md:grid-cols-[1.2fr_1fr] gap-6 md:gap-8 flex-1 min-h-0">
          <section className="rounded-2xl bg-card text-card-foreground ring-1 ring-border p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Up next</h2>
            <div className="flex-1 overflow-y-auto min-h-0 mt-4 pr-2 custom-scrollbar">
              {waiting.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No one waiting at the moment</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {waiting.map((e) => (
                    <li key={e.id} className="py-3 sm:py-4 flex items-center gap-4 sm:gap-6">
                      <span className="w-12 sm:w-14 shrink-0 text-left text-3xl sm:text-4xl font-semibold tabular-nums">
                        {e.ticket_number ?? e.queue_position ?? "-"}
                      </span>
                      <div className="flex items-center gap-4 sm:gap-8 flex-wrap">
                        {showNameOnDisplay && e.customer_name ? (
                          <div className="text-lg font-medium">{e.customer_name}</div>
                        ) : null}
                        {typeof e.party_size === 'number' ? (
                          <div className="flex items-center gap-1.5 text-lg sm:text-xl font-medium">
                            <User className="h-5 w-5" />
                            <span>{e.party_size}</span>
                          </div>
                        ) : null}
                        {e.seating_preference && (
                          <Badge variant="secondary" className="text-sm sm:text-lg px-3 py-1.5 sm:py-4">{e.seating_preference}</Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-50 dark:ring-emerald-800 p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden">
            <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 shrink-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Now calling
            </h2>
            <div className="flex-1 overflow-y-auto min-h-0 mt-4 pr-2 custom-scrollbar">
              {notified.length === 0 ? (
                <div className="text-center py-12 opacity-60">
                  <p className="text-xl">Waiting for next group...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {notified.map((e) => (
                    <div key={e.id} className="flex items-center gap-4 sm:gap-8 rounded-xl p-4 sm:p-6 bg-background/50 dark:bg-background/20">
                      <span className="text-5xl sm:text-6xl font-extrabold tabular-nums">
                        {e.ticket_number ?? e.queue_position ?? "-"}
                      </span>
                      <div className="flex items-center gap-4 sm:gap-8 flex-wrap">
                        {showNameOnDisplay && e.customer_name ? (
                          <div className="text-xl sm:text-2xl font-semibold">{e.customer_name}</div>
                        ) : null}
                        {typeof e.party_size === 'number' ? (
                          <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-medium">
                            <User className="h-6 w-6" />
                            <span>{e.party_size}</span>
                          </div>
                        ) : null}
                        {e.seating_preference && (
                          <Badge variant="secondary" className="text-sm sm:text-xl px-3 py-1.5 sm:py-4">{e.seating_preference}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div >

        {/* QR code for joining - only shown on larger screens */}
        {showQrOnDisplay ? (
          <div className="hidden lg:flex fixed bottom-6 right-6 z-50 flex-col items-center gap-2 rounded-2xl border border-border bg-card/95 backdrop-blur p-4 shadow-lg">
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt="QR code"
                className="h-32 w-32 rounded-xl bg-white p-2"
                onError={() => {
                  const providers = [
                    (t: string) => `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=2&data=${encodeURIComponent(t)}`,
                    (t: string) => `https://quickchart.io/qr?size=240&margin=2&text=${encodeURIComponent(t)}`,
                    (t: string) => `https://chart.googleapis.com/chart?cht=qr&chs=240x240&chld=L|2&chl=${encodeURIComponent(t)}`,
                  ];
                  if (qrProviderIndex < providers.length - 1) {
                    const next = qrProviderIndex + 1;
                    const base = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
                    const displayUrl = `${base}/display/${encodeURIComponent(token)}`;
                    setQrProviderIndex(next);
                    setQrUrl(providers[next](displayUrl));
                  }
                }}
              />
            ) : (
              <div className="h-32 w-32 rounded-xl bg-muted" />
            )}
            <div className="text-center text-sm font-medium text-muted-foreground">Scan to join</div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-center shrink-0 gap-1">
          <span className="text-xs font-medium text-muted-foreground">Powered by</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/waitq.svg" alt="WaitQ" className="h-4 w-auto logo-light" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/waitq-variant.svg" alt="WaitQ" className="h-4 w-auto logo-dark" />
        </div>
      </div >
    </main >
  );
}


function KioskButton({
  token,
  defaultCountry,
  seatingPreferences,
  askName,
  askPhone,
  askEmail,
  disabled,
  disabledReason,
}: {
  token: string;
  defaultCountry: string;
  seatingPreferences: string[];
  askName: boolean;
  askPhone: boolean;
  askEmail: boolean;
  disabled?: boolean;
  disabledReason?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [partySize, setPartySize] = useState<number | undefined>(1);
  const [pref, setPref] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | null>(null);
  const [duplicateDialog, setDuplicateDialog] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setStep("form");
    setPhone(undefined);
    setName(undefined);
    setEmail(undefined);
    setPartySize(1);
    setPref(undefined);
    setMessage(null);
    setTicketNumber(null);
    setDuplicateDialog({ open: false, message: "" });
  };

  const submit = () => {
    setMessage(null);
    setPhoneError(null);
    startTransition(async () => {
      if (askPhone && !phone) {
        setPhoneError("Please enter your phone number");
        return;
      }
      if (askName && !name) {
        setMessage("Please enter your name");
        return;
      }
      const res = await fetch("/api/display/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, phone, name, email: askEmail ? email : undefined, partySize, seatingPreference: pref }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setTicketNumber(j.ticketNumber ?? null);
        setStep("confirm");
      } else {
        if (res.status === 409) {
          const errStr = typeof j?.error === "string" ? j.error : "This person is already waiting.";
          setDuplicateDialog({ open: true, message: errStr });
          return;
        }
        const err = (j && j.error) || "Failed to add to waiting list";
        // If server returns a structured error for phone, surface it on the field
        const errStr = typeof err === "string" ? err : "";
        if (/phone/i.test(errStr)) {
          setPhoneError(errStr.replace(/^phone:\s*/i, "").trim() || errStr);
          setMessage(null);
        } else {
          setMessage(typeof err === "string" ? err : "Failed to add to waiting list");
        }
      }
    });
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl sm:text-3xl">
              {step === "confirm" ? "You're all set!" : "Add to waiting list"}
            </DialogTitle>
          </DialogHeader>

          {step === "form" ? (
            <div className="grid gap-5 text-foreground">
              <div className="grid gap-2">
                <label className="text-base font-medium">Number of people</label>
                <Stepper value={partySize} onChange={setPartySize} min={1} max={20} />
              </div>

              {Array.isArray(seatingPreferences) && seatingPreferences.length > 0 ? (
                <div className="grid gap-2">
                  <label className="text-base font-medium">Seating preference</label>
                  <div className="flex flex-wrap gap-3">
                    {seatingPreferences.map((s) => {
                      const active = pref === s;
                      return (
                        <Button
                          type="button"
                          key={s}
                          onClick={() => setPref(s)}
                          variant={active ? "default" : "secondary"}
                          className="h-11 sm:h-14 px-4 sm:px-6 rounded-2xl text-base sm:text-lg"
                        >
                          {s}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {askName && (
                <div className="grid gap-2">
                  <label className="text-base font-medium" htmlFor="kiosk-name">Name</label>
                  <input
                    id="kiosk-name"
                    type="text"
                    value={name || ""}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border-0 shadow-sm ring-1 ring-inset ring-border px-4 py-3 text-2xl text-foreground focus:ring-2 focus:ring-primary bg-background"
                    placeholder="Your Name"
                  />
                </div>
              )}

              {askPhone && (
                <div className="grid gap-2">
                  <label className="text-base font-medium" htmlFor="kiosk-phone">Phone number</label>
                  <PhoneInput
                    id="kiosk-phone"
                    international
                    defaultCountry={defaultCountry as Country}
                    value={phone}
                    onChange={(value) => { setPhone(value || undefined); setPhoneError(null); }}
                    withCountryCallingCode
                    countryCallingCodeEditable={true}
                    className={`block w-full rounded-xl border-0 shadow-sm ring-1 ring-inset px-4 py-3 text-2xl text-foreground focus:ring-2 ${phoneError ? "ring-red-500 focus:ring-red-600" : "ring-border focus:ring-primary"}`}
                    aria-invalid={phoneError ? true : false}
                    aria-describedby={phoneError ? "kiosk-phone-error" : undefined}
                  />
                  {phoneError ? (
                    <p id="kiosk-phone-error" className="text-sm text-red-600">{phoneError}</p>
                  ) : null}
                </div>
              )}

              {askEmail ? (
                <div className="grid gap-2">
                  <label className="text-base font-medium" htmlFor="kiosk-email">Email (optional)</label>
                  <input
                    id="kiosk-email"
                    type="email"
                    value={email || ""}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border-0 shadow-sm ring-1 ring-inset ring-border px-4 py-3 text-2xl text-foreground focus:ring-2 focus:ring-primary bg-background"
                    placeholder="name@example.com"
                  />
                </div>
              ) : null}
              <Button disabled={isPending} onClick={submit} size="lg" className="w-full h-12 sm:h-14 text-base sm:text-xl rounded-xl disabled:opacity-50">
                {isPending ? "Submitting…" : "Join waitlist"}
              </Button>
              {message ? <p className="text-sm text-red-600">{message}</p> : null}
            </div>
          ) : (
            <div className="grid gap-5 text-center text-foreground">
              {askEmail && email ? (
                <p className="text-lg">We sent your ticket details to your email.</p>
              ) : askPhone ? (
                <p className="text-lg">We&apos;ll notify you when your table is ready.</p>
              ) : null}
              <div>
                <p className="text-sm text-muted-foreground">Your ticket</p>
                <div className="mt-2 text-6xl font-extrabold text-foreground">{ticketNumber ?? "-"}</div>
              </div>
              <Button onClick={close} size="lg" className="w-full h-14 text-xl rounded-xl">
                Done
              </Button>
            </div>
          )}
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


