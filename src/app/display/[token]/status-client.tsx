"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/modal";
import PhoneInput, { type Country } from "react-phone-number-input";
import 'react-phone-number-input/style.css';

type Entry = { id: string; ticket_number: number | null; queue_position: number | null; status: string; notified_at?: string | null; party_size?: number | null; seating_preference?: string | null };
type Payload = { listId: string; listName: string; kioskEnabled?: boolean; businessCountry?: string | null; listType?: string | null; seatingPreferences?: string[]; estimatedMs?: number; entries: Entry[]; accentColor?: string; backgroundColor?: string };

export default function DisplayClient({ token }: { token: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<number | null>(null);
  const prev = useRef<Payload | null>(null);
  const supabase = createClient();
  const subCreated = useRef<boolean>(false);
  const bcCreated = useRef<boolean>(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  async function load(silent: boolean = false) {
    if (!silent && !data) setLoading(true);
    const res = await fetch(`/api/display?token=${encodeURIComponent(token)}`, { cache: "no-store" });
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
    load();
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [token]);

  // Optional: disable polling fallback; rely only on realtime and broadcast
  // useEffect(() => {
  //   const id = window.setInterval(() => load(true), 2000);
  //   return () => window.clearInterval(id);
  // }, [token]);

  useEffect(() => {
    if (!data?.listId || subCreated.current) return;
    const channel = supabase
      .channel(`public-display-${data.listId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waitlist_entries", filter: `waitlist_id=eq.${data.listId}` },
        () => {
          if (timer.current) window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => load(true), 100);
        }
      )
      .subscribe();
    subCreated.current = true;
    return () => {
      supabase.removeChannel(channel);
      subCreated.current = false;
    };
  }, [supabase, data?.listId]);

  // Broadcast fallback: listen for refresh notifications from dashboard
  useEffect(() => {
    if (bcCreated.current) return;
    const channel = supabase
      .channel(`display-bc-${token}`)
      .on('broadcast', { event: 'refresh' }, () => {
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => load(true), 100);
      })
      .subscribe();
    bcCreated.current = true;
    return () => {
      supabase.removeChannel(channel);
      bcCreated.current = false;
    };
  }, [supabase, token]);

  const bg = data?.backgroundColor || "#000000";
  // Accent customization removed: brand is now locked to the preset theme.
  if (loading || !data) return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <p className="text-muted-foreground">Loading…</p>
    </main>
  );

  const notified = data.entries.filter((e) => e.status === "notified");
  const nowServing = notified.length
    ? notified
        .slice()
        .sort((a, b) => {
          const ad = a.notified_at ? new Date(a.notified_at).getTime() : 0;
          const bd = b.notified_at ? new Date(b.notified_at).getTime() : 0;
          if (ad !== bd) return bd - ad; // latest notified first
          return (b.ticket_number ?? 0) - (a.ticket_number ?? 0);
        })[0]
    : null;
  const waiting = data.entries.filter((e) => e.status === "waiting").slice(0, 10);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{data.listName}</h1>
          <button type="button" aria-label="Toggle theme" className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-muted">
            <span className="sr-only">Toggle theme</span>
          </button>
        </div>
        <div className="mt-4 flex items-center justify-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/waitq.svg" alt="WaitQ" className="h-5 w-auto logo-light" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/waitq-variant.svg" alt="WaitQ" className="h-5 w-auto logo-dark" />
        </div>
        {typeof data.estimatedMs === 'number' && data.estimatedMs > 0 ? (
          <p className="mt-2 text-muted-foreground">Estimated wait time: {formatDuration(data.estimatedMs)}</p>
        ) : null}
        {data.kioskEnabled ? (
          <div className="mt-4">
            <KioskButton token={token} defaultCountry={data.businessCountry || "PT"} listType={data.listType || "restaurants"} seatingPreferences={data.seatingPreferences || []} accent="#FFFFFF" />
          </div>
        ) : null}
        <div className="mt-8 grid md:grid-cols-[1fr_1.2fr] gap-8">
          <section className="rounded-2xl bg-card text-card-foreground ring-1 ring-border p-6">
            <h2 className="text-base text-muted-foreground">Now serving</h2>
            {nowServing ? (
              <div className="mt-2 text-6xl font-extrabold">{nowServing.ticket_number ?? nowServing.queue_position ?? "-"}</div>
            ) : (
              <div className="mt-2 text-muted-foreground">No one is being served</div>
            )}
          </section>
          <section className="rounded-2xl bg-card text-card-foreground ring-1 ring-border p-6">
            <h2 className="text-base text-muted-foreground">Up next</h2>
            <ul className="mt-2 divide-y divide-border">
              {waiting.map((e) => (
                <li key={e.id} className="py-3 flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-lg font-medium">{e.seating_preference || ""}</div>
                    {typeof e.party_size === 'number' ? (
                      <div className="text-sm text-muted-foreground">Party: {e.party_size}</div>
                    ) : null}
                  </div>
                  <span className="text-2xl font-semibold">{e.ticket_number ?? e.queue_position ?? "-"}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}


function KioskButton({ token, defaultCountry, listType, seatingPreferences, accent }: { token: string; defaultCountry: string; listType: string; seatingPreferences: string[]; accent: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"intro" | "form" | "confirm">("intro");
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [partySize, setPartySize] = useState<number | undefined>(undefined);
  const [pref, setPref] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setStep("intro");
    setPhone(undefined);
    setPartySize(undefined);
    setPref(undefined);
    setMessage(null);
    setTicketNumber(null);
  };

  const submit = () => {
    setMessage(null);
    setPhoneError(null);
    startTransition(async () => {
      if (!phone) {
        setPhoneError("Please enter your phone number");
        return;
      }
      const res = await fetch("/api/display/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, phone, partySize, seatingPreference: pref }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setTicketNumber(j.ticketNumber ?? null);
        setStep("confirm");
      } else {
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
      <button onClick={() => setOpen(true)} className="inline-flex items-center rounded-md px-4 py-3 text-base font-semibold shadow-sm"
        style={{ backgroundColor: accent, color: getReadableTextColor(accent) }}>
        Add to Waiting list
      </button>
      <Modal open={open} onClose={close} title={step === "confirm" ? "You&apos;re on the list" : "Add to waiting list"}>
        {step === "intro" ? (
          <div className="grid gap-5 text-foreground">
            {listType === "restaurants" ? (
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <label className="text-base font-medium">Number of people</label>
                  <div className="text-4xl font-bold px-4 py-3 rounded-xl ring-1 ring-inset ring-border bg-card min-h-[64px] flex items-center">
                    {typeof partySize === 'number' ? partySize : ''}
                  </div>
                  <KeypadNumeric
                    value={typeof partySize === 'number' ? String(partySize) : ''}
                    onChange={(val) => {
                      const sanitized = String(val).replace(/[^0-9]/g, "");
                      if (!sanitized) {
                        setPartySize(undefined);
                      } else {
                        const n = parseInt(sanitized, 10);
                        setPartySize(Number.isFinite(n) && n > 0 ? n : undefined);
                      }
                    }}
                  />
                </div>
                {Array.isArray(seatingPreferences) && seatingPreferences.length > 0 ? (
                  <div className="grid gap-2">
                    <label className="text-base font-medium">Seating preference</label>
                    <div className="flex flex-wrap gap-4">
                      {seatingPreferences.map((s) => {
                        const active = pref === s;
                        return (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setPref(s)}
                            className={`px-6 py-4 rounded-2xl ring-1 ring-inset text-lg ${active ? "bg-primary text-primary-foreground ring-primary" : "bg-card text-foreground ring-border hover:bg-muted"}`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="min-h-[120px]" />
            )}
            <button onClick={() => setStep("form")} className="w-full inline-flex items-center justify-center rounded-xl px-5 py-4 text-lg font-semibold shadow-sm"
              style={{ backgroundColor: accent, color: getReadableTextColor(accent) }}>
              Continue
            </button>
          </div>
        ) : step === "form" ? (
          <div className="grid gap-5 text-foreground">
            <div className="grid gap-2">
              <label className="text-base font-medium" htmlFor="kiosk-phone">Phone number</label>
              <PhoneInput
                id="kiosk-phone"
                international
                defaultCountry={defaultCountry as Country}
                value={phone}
                onChange={(value) => { setPhone(value || undefined); setPhoneError(null); }}
                className={`block w-full rounded-xl border-0 shadow-sm ring-1 ring-inset px-4 py-3 text-2xl text-foreground focus:ring-2 ${phoneError ? "ring-red-500 focus:ring-red-600" : "ring-border focus:ring-primary"}`}
                aria-invalid={phoneError ? true : false}
                aria-describedby={phoneError ? "kiosk-phone-error" : undefined}
              />
              {phoneError ? (
                <p id="kiosk-phone-error" className="text-sm text-red-600">{phoneError}</p>
              ) : null}
            </div>
            <Keypad value={phone} onChange={setPhone} />
            <button disabled={isPending} onClick={submit} className="w-full inline-flex items-center justify-center rounded-xl px-5 py-4 text-lg font-semibold shadow-sm disabled:opacity-50"
              style={{ backgroundColor: accent, color: getReadableTextColor(accent) }}>
              {isPending ? "Submitting…" : "Continue"}
            </button>
            {message ? <p className="text-sm text-red-600">{message}</p> : null}
          </div>
        ) : (
          <div className="grid gap-5 text-center text-foreground">
            <p className="text-lg">Thanks! You&apos;re on the waiting list.</p>
            <div>
              <p className="text-sm text-muted-foreground">Your ticket</p>
              <div className="mt-2 text-6xl font-extrabold text-foreground">{ticketNumber ?? "-"}</div>
            </div>
            <button onClick={close} className="w-full inline-flex items-center justify-center rounded-xl px-5 py-4 text-lg font-semibold shadow-sm"
              style={{ backgroundColor: accent, color: getReadableTextColor(accent) }}>
              Done
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

function Keypad({ value, onChange }: { value: string | undefined; onChange: (v: string | undefined) => void }) {
  const buttons = ["1","2","3","4","5","6","7","8","9","+","0","←"];
  const press = (k: string) => {
    const cur = value || "";
    if (k === "←") {
      const next = cur.slice(0, -1);
      onChange(next || undefined);
    } else {
      onChange(`${cur}${k}`);
    }
  };
  return (
    <div className="grid grid-cols-3 gap-3">
      {buttons.map((k) => (
        <button
          key={k}
          onClick={() => press(k)}
          className="h-16 text-2xl font-semibold rounded-xl ring-1 ring-inset ring-border bg-card hover:bg-muted"
        >
          {k}
        </button>
      ))}
    </div>
  );
}
function formatDuration(ms: number) {
  const totalMin = Math.max(1, Math.round(ms / 60000));
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}


function KeypadNumeric({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const buttons = ["1","2","3","4","5","6","7","8","9","Clear","0","←"];
  const press = (k: string) => {
    if (k === "←") {
      onChange(value.slice(0, -1));
    } else if (k === "Clear") {
      onChange("");
    } else {
      onChange(`${value}${k}`);
    }
  };
  return (
    <div className="grid grid-cols-3 gap-3">
      {buttons.map((k) => (
        <button
          key={k}
          onClick={() => press(k)}
          className="h-16 text-2xl font-semibold rounded-xl ring-1 ring-inset ring-border bg-card hover:bg-muted"
        >
          {k}
        </button>
      ))}
    </div>
  );
}

function getReadableTextColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Per W3C luminance approximation
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#FFFFFF";
}


