"use client";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import PhoneInput from "react-phone-number-input";
import 'react-phone-number-input/style.css';

type FormValues = { phone: string; customerName: string; waitlistId: string; sendSms: boolean; sendWhatsapp: boolean };

export default function AddForm({ onDone, defaultWaitlistId, lockWaitlist }: { onDone?: () => void; defaultWaitlistId?: string; lockWaitlist?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: { phone: "", customerName: "", waitlistId: "", sendSms: false, sendWhatsapp: false },
  });
  const [waitlists, setWaitlists] = useState<{ id: string; name: string; display_token?: string }[]>([]);

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
        reset({ phone: "", customerName: "", waitlistId: values.waitlistId, sendSms: false, sendWhatsapp: false });
        setMessage("Added and message sent (if configured)");
        // No extra toasts; rely on realtime to update UI
        onDone?.();
      } else {
        let parsed: unknown = {};
        try {
          parsed = await res.json();
        } catch {}
        const err = (parsed as { error?: unknown }).error;
        let msg = "Failed to add";
        if (typeof err === "string") msg = err;
        else if (err && typeof err === "object") {
          const e = err as {
            message?: unknown;
            formErrors?: unknown;
            fieldErrors?: Record<string, string[] | undefined>;
          };
          if (typeof e.message === "string") msg = e.message;
          else if (Array.isArray(e.formErrors) && e.formErrors.length) msg = e.formErrors.join(", ");
          else if (e.fieldErrors && typeof e.fieldErrors === "object") {
            const parts = Object.entries(e.fieldErrors)
              .flatMap(([field, arr]) => (arr || []).map((v) => `${field}: ${v}`));
            if (parts.length) msg = parts.join("; ");
          }
        }
        setMessage(msg);
      }
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        {lockWaitlist ? null : (
          <div className="grid gap-1">
            <label className="text-sm font-medium">Waitlist</label>
            <select disabled={!!lockWaitlist} className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-3 py-2 text-sm disabled:opacity-50" {...register("waitlistId", { required: true })}>
              {waitlists.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid gap-1">
          <label className="text-sm font-medium">Customer name</label>
          <input className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-3 py-2 text-sm" placeholder="Full name" {...register("customerName", { required: true })}/>
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Phone</label>
          <PhoneInput
            international
            defaultCountry="US"
            value={watch("phone")}
            onChange={(value) => setValue("phone", value || "")}
            className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Notify via</label>
          <div className="flex items-center gap-2">
            <input id="send-sms" type="checkbox" className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black" {...register("sendSms")} />
            <label htmlFor="send-sms" className="text-sm">SMS</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="send-wa" type="checkbox" className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black" {...register("sendWhatsapp")} />
            <label htmlFor="send-wa" className="text-sm">WhatsApp</label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={isPending} className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50">
            {isPending ? "Adding…" : "Add"}
          </button>
          {message ? <p className="text-sm text-neutral-600">{message}</p> : null}
        </div>
      </form>
    </div>
  );
}


