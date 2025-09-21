"use client";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

type FormValues = { phone: string; customerName: string; waitlistId: string; sendSms: boolean };

export default function AddForm({ onDone }: { onDone?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: { phone: "", customerName: "", waitlistId: "", sendSms: false },
  });
  const [waitlists, setWaitlists] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/waitlists", { cache: "no-store" });
      const j = await res.json();
      setWaitlists(j.waitlists || []);
      if ((j.waitlists || []).length > 0) {
        reset((v) => ({ ...v, waitlistId: j.waitlists[0].id }));
      }
    })();
  }, [reset]);

  const onSubmit = (values: FormValues) => {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        reset({ phone: "", customerName: "", waitlistId: values.waitlistId, sendSms: false });
        setMessage("Added and SMS sent (if configured)");
        try {
          const { toast } = await import("react-hot-toast");
          toast.success("Added to waitlist");
        } catch {}
        onDone?.();
      } else {
        const j = await res.json().catch(() => ({}));
        setMessage(j?.error ?? "Failed to add");
      }
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-1">
          <label className="text-sm font-medium">Waitlist</label>
          <select className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-3 py-2 text-sm" {...register("waitlistId", { required: true })}>
            {waitlists.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Customer name</label>
          <input className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-3 py-2 text-sm" placeholder="Full name" {...register("customerName", { required: true })}/>
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Phone</label>
          <input className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-3 py-2 text-sm" placeholder="+15551234567" {...register("phone", { required: true })} />
        </div>
        <div className="flex items-center gap-2">
          <input id="send-sms" type="checkbox" className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black" {...register("sendSms")} />
          <label htmlFor="send-sms" className="text-sm">Send SMS notification</label>
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


