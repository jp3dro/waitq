"use client";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import 'react-phone-number-input/style.css';
import type { Country } from "react-phone-number-input";
import { toastManager } from "@/hooks/use-toast";
import { Stepper } from "@/components/ui/stepper";

type FormValues = { phone: string; customerName: string; waitlistId: string; sendSms: boolean; sendWhatsapp: boolean; partySize?: number; seatingPreference?: string };

export default function AddForm({ onDone, defaultWaitlistId, lockWaitlist, businessCountry, formId = "add-waitlist-form", onPendingChange }: { onDone?: () => void; defaultWaitlistId?: string; lockWaitlist?: boolean; businessCountry?: Country; formId?: string; onPendingChange?: (pending: boolean) => void }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch, setValue, setError, setFocus, formState: { errors } } = useForm<FormValues>({
    defaultValues: { phone: "", customerName: "", waitlistId: "", sendSms: false, sendWhatsapp: false, partySize: 2 },
  });
  const [waitlists, setWaitlists] = useState<{ id: string; name: string; display_token?: string; list_type?: string; seating_preferences?: string[] }[]>([]);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/waitlists", { cache: "no-store" });
      const j = await res.json();
      setWaitlists(j.waitlists || []);
      if (defaultWaitlistId) {
        reset((v) => ({ ...v, waitlistId: defaultWaitlistId }));
      } else if ((j.waitlists || []).length > 0) {
        reset((v) => ({ ...v, waitlistId: j.waitlists[0].id }));
      }
      // Focus the name field when modal opens
      try { setFocus("customerName"); } catch {}
    })();
  }, [reset, defaultWaitlistId]);

  const onSubmit = (values: FormValues) => {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toastManager.add({
          title: "Success",
          description: "Customer added to waitlist successfully",
          type: "success",
        });
        reset({ phone: "", customerName: "", waitlistId: values.waitlistId, sendSms: false, sendWhatsapp: false, partySize: 2, seatingPreference: undefined });
        setMessage("Added and message sent (if configured)");
        // Local optimistic refresh and broadcast
        try {
          window.dispatchEvent(new CustomEvent('wl:refresh', { detail: { waitlistId: values.waitlistId } }));
        } catch {}
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const sb = createClient();
          const ch = sb.channel(`waitlist-entries-${values.waitlistId}`);
          ch.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              try { await ch.send({ type: 'broadcast', event: 'refresh', payload: {} }); } catch {}
              try { sb.removeChannel(ch); } catch {}
            }
          });
        } catch {}
        onDone?.();
      } else {
        let parsed: unknown = {};
        try {
          parsed = await res.json();
        } catch {}
        const err = (parsed as { error?: unknown }).error;
        let msg = "Failed to add";
        let hasFieldErrors = false;

        if (typeof err === "string") msg = err;
        else if (err && typeof err === "object") {
          const e = err as {
            message?: unknown;
            formErrors?: unknown;
            fieldErrors?: Record<string, string[] | undefined>;
          };

          // Handle field-specific errors
          if (e.fieldErrors && typeof e.fieldErrors === "object") {
            Object.entries(e.fieldErrors).forEach(([field, messages]) => {
              if (messages && messages.length > 0) {
                // Map API field names to form field names
                const formField = field === 'customerName' ? 'customerName' :
                                 field === 'phone' ? 'phone' :
                                 field === 'waitlistId' ? 'waitlistId' : field;
                setError(formField as keyof FormValues, {
                  type: 'server',
                  message: messages[0] // Use first error message
                });
                hasFieldErrors = true;
              }
            });
          }

          if (typeof e.message === "string") msg = e.message;
          else if (Array.isArray(e.formErrors) && e.formErrors.length) msg = e.formErrors.join(", ");
          else if (e.fieldErrors && !hasFieldErrors) {
            // Fallback to generic message if we couldn't set field errors
            const parts = Object.entries(e.fieldErrors)
              .flatMap(([field, arr]) => (arr || []).map((v) => `${field}: ${v}`));
            if (parts.length) msg = parts.join("; ");
          }
        }

        // Only show generic message if we don't have field-specific errors
        if (!hasFieldErrors) {
          setMessage(msg);
        }
      }
    });
  };

  return (
    <div>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        {lockWaitlist ? null : (
          <div className="grid gap-2">
            <label className="text-sm font-medium">Waitlist</label>
            <select disabled={!!lockWaitlist} className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm disabled:opacity-50" {...register("waitlistId", { required: true })}>
              {waitlists.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            {errors.waitlistId && (
              <p className="text-sm text-red-600">{errors.waitlistId.message}</p>
            )}
          </div>
        )}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Customer name</label>
          <input className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm" placeholder="Full name" {...register("customerName", { required: true })}/>
          {errors.customerName && (
            <p className="text-sm text-red-600">{errors.customerName.message}</p>
          )}
        </div>
        {(waitlists.find(w => w.id === watch("waitlistId"))?.list_type || "restaurants") === "restaurants" ? (
          <>
            <div className="flex gap-6">
              <div className="flex-none grid gap-2">
                <label className="text-sm font-medium">Number of people</label>
                <Stepper
                  value={watch("partySize")}
                  onChange={(value) => setValue("partySize", value)}
                  min={1}
                  max={20}
                />
              </div>
              <div className="flex-1 grid gap-2">
                <label className="text-sm font-medium">Phone</label>
                <PhoneInput
                  international
                  defaultCountry={(businessCountry ?? "PT") as Country}
                  value={watch("phone")}
                  onChange={(value) => setValue("phone", value || "")}
                  className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>
            {(waitlists.find(w => w.id === watch("waitlistId"))?.seating_preferences || []).length > 0 ? (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Seating preference</label>
                <div className="flex flex-wrap gap-2">
                  {(waitlists.find(w => w.id === watch("waitlistId"))?.seating_preferences || []).map((s) => {
                    const selected = watch("seatingPreference") === s;
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setValue("seatingPreference", s)}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs ring-1 ring-inset transition ${selected ? "bg-primary text-primary-foreground ring-primary" : "bg-card text-foreground ring-border hover:bg-muted"}`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="grid gap-2">
            <label className="text-sm font-medium">Phone</label>
            <PhoneInput
              international
              defaultCountry={(businessCountry ?? "PT") as Country}
              value={watch("phone")}
              onChange={(value) => setValue("phone", value || "")}
              className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
            />
          </div>
        )}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Notify via</label>
          <div className="flex items-center gap-2">
            <input id="send-sms" type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-ring" {...register("sendSms")} />
            <label htmlFor="send-sms" className="text-sm">SMS</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="send-wa" type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-ring" {...register("sendWhatsapp")} />
            <label htmlFor="send-wa" className="text-sm">WhatsApp</label>
          </div>
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </form>
    </div>
  );
}


