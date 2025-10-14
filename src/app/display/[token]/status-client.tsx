"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/modal";
import PhoneInput from "react-phone-number-input";
import 'react-phone-number-input/style.css';

type Entry = { id: string; ticket_number: number | null; queue_position: number | null; status: string; notified_at?: string | null; party_size?: number | null; seating_preference?: string | null };
type Payload = { listId: string; listName: string; kioskEnabled?: boolean; businessCountry?: string | null; listType?: string | null; seatingPreferences?: string[]; estimatedMs?: number; entries: Entry[] };

export default function DisplayClient({ token }: { token: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<number | null>(null);
  const prev = useRef<Payload | null>(null);
  const supabase = createClient();
  const subCreated = useRef<boolean>(false);
  const bcCreated = useRef<boolean>(false);

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

  if (loading || !data) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-neutral-400">Loading…</p>
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
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{data.listName}</h1>
        {typeof data.estimatedMs === 'number' && data.estimatedMs > 0 ? (
          <p className="mt-2 text-neutral-300">Estimated wait time: {formatDuration(data.estimatedMs)}</p>
        ) : null}
        {data.kioskEnabled ? (
          <div className="mt-4">
            <KioskButton token={token} defaultCountry={data.businessCountry || "PT"} listType={data.listType || "restaurants"} seatingPreferences={data.seatingPreferences || []} />
          </div>
        ) : null}
        <div className="mt-8 grid md:grid-cols-[1fr_1.2fr] gap-8">
          <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">
            <h2 className="text-base text-neutral-300">Now serving</h2>
            {nowServing ? (
              <div className="mt-2 text-6xl font-extrabold">{nowServing.ticket_number ?? nowServing.queue_position ?? "-"}</div>
            ) : (
              <div className="mt-2 text-neutral-400">No one is being served</div>
            )}
          </section>
          <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">
            <h2 className="text-base text-neutral-300">Up next</h2>
            <ul className="mt-2 divide-y divide-white/10">
              {waiting.map((e) => (
                <li key={e.id} className="py-3 flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-lg font-medium">{e.seating_preference || ""}</div>
                    {typeof e.party_size === 'number' ? (
                      <div className="text-sm text-neutral-400">Party: {e.party_size}</div>
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


function KioskButton({ token, defaultCountry, listType, seatingPreferences }: { token: string; defaultCountry: string; listType: string; seatingPreferences: string[] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"intro" | "form" | "confirm">("intro");
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [partySize, setPartySize] = useState<number | undefined>(undefined);
  const [pref, setPref] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

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
    startTransition(async () => {
      if (!phone) {
        setMessage("Please enter your phone number");
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
        setMessage(typeof err === "string" ? err : "Failed to add to waiting list");
      }
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center rounded-md bg-white text-black px-4 py-3 text-base font-semibold shadow-sm hover:bg-neutral-200">
        Add to Waiting list
      </button>
      <Modal open={open} onClose={close} title={step === "confirm" ? "You're on the list" : "Add to waiting list"}>
        {step === "intro" ? (
          <div className="grid gap-5 text-neutral-900">
            {listType === "restaurants" ? (
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <label className="text-base font-medium">Number of people</label>
                  <div className="text-4xl font-bold px-4 py-3 rounded-xl ring-1 ring-inset ring-neutral-300 bg-white min-h-[64px] flex items-center">
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
                          className={`px-6 py-4 rounded-2xl ring-1 ring-inset text-lg ${active ? "bg-black text-white ring-black" : "bg-white text-neutral-900 ring-neutral-300 hover:bg-neutral-100"}`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-[120px]" />
            )}
            <button
              onClick={() => setStep("form")}
              className="w-full inline-flex items-center justify-center rounded-xl bg-black px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-neutral-800"
            >
              Continue
            </button>
          </div>
        ) : step === "form" ? (
          <div className="grid gap-5 text-neutral-900">
            <div className="grid gap-2">
              <label className="text-base font-medium">Phone number</label>
              <PhoneInput
                international
                defaultCountry={defaultCountry as any}
                value={phone}
                onChange={(value) => setPhone(value || undefined)}
                className="block w-full rounded-xl border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-4 py-3 text-2xl text-neutral-900"
              />
            </div>
            <Keypad value={phone} onChange={setPhone} />
            <button
              disabled={isPending}
              onClick={submit}
              className="w-full inline-flex items-center justify-center rounded-xl bg-black px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50"
            >
              {isPending ? "Submitting…" : "Continue"}
            </button>
            {message ? <p className="text-sm text-red-600">{message}</p> : null}
          </div>
        ) : (
          <div className="grid gap-5 text-center text-neutral-900">
            <p className="text-lg">Thanks! You're on the waiting list.</p>
            <div>
              <p className="text-sm text-neutral-600">Your ticket</p>
              <div className="mt-2 text-6xl font-extrabold text-neutral-900">{ticketNumber ?? "-"}</div>
            </div>
            <button onClick={close} className="w-full inline-flex items-center justify-center rounded-xl bg-black text-white px-5 py-4 text-lg font-semibold shadow-sm hover:bg-neutral-800">
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
          className="h-16 text-2xl font-semibold rounded-xl ring-1 ring-inset ring-neutral-300 bg-white hover:bg-neutral-100"
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
          className="h-16 text-2xl font-semibold rounded-xl ring-1 ring-inset ring-neutral-300 bg-white hover:bg-neutral-100"
        >
          {k}
        </button>
      ))}
    </div>
  );
}


