"use client";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { PhoneInput, type Country } from "@/components/ui/phone-input";
import { toastManager } from "@/hooks/use-toast";
import { Stepper } from "@/components/ui/stepper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FormValues = {
  phone: string;
  email: string;
  customerName: string;
  waitlistId: string;
  sendSms: boolean;
  sendEmail: boolean;
  partySize?: number;
  seatingPreference?: string;
};

type WaitlistConfig = {
  id: string;
  name: string;
  seating_preferences?: string[];
  ask_name?: boolean;
  ask_phone?: boolean;
  ask_email?: boolean;
  location_is_open?: boolean;
  location_status_reason?: string | null;
};

type PublicConfig = {
  displayToken: string;
  waitlist: WaitlistConfig;
};

export default function AddForm({
  onDone,
  defaultWaitlistId,
  lockWaitlist,
  businessCountry,
  formId = "add-waitlist-form",
  onPendingChange,
  onBlockedReasonChange,
  mode = "internal",
  publicConfig,
  onPublicSuccess,
}: {
  onDone?: () => void;
  defaultWaitlistId?: string;
  lockWaitlist?: boolean;
  businessCountry?: Country;
  formId?: string;
  onPendingChange?: (pending: boolean) => void;
  onBlockedReasonChange?: (reason: string | null) => void;
  mode?: "internal" | "public";
  publicConfig?: PublicConfig;
  onPublicSuccess?: (payload: { statusUrl?: string; ticketNumber?: number | null }) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [duplicateDialog, setDuplicateDialog] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [smsUsage, setSmsUsage] = useState<{ used: number; limit: number; windowEnd?: string } | null>(null);
  const { register, handleSubmit, reset, watch, setValue, setError, setFocus, formState: { errors } } = useForm<FormValues>({
    defaultValues: { phone: "", email: "", customerName: "", waitlistId: "", sendSms: false, sendEmail: false, partySize: 2 },
  });
  const [waitlists, setWaitlists] = useState<WaitlistConfig[]>([]);
  const [fetching, setFetching] = useState(true);
  const isPublic = mode === "public";

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    if (isPublic) {
      if (!publicConfig) {
        setWaitlists([]);
        setFetching(false);
        return;
      }
      setWaitlists([publicConfig.waitlist]);
      reset((v) => ({ ...v, waitlistId: publicConfig.waitlist.id }));
      setFetching(false);
      try { setTimeout(() => setFocus("customerName"), 50); } catch { }
      return;
    }
    (async () => {
      const res = await fetch("/api/waitlists", { cache: "no-store" });
      const j = await res.json();
      setWaitlists(j.waitlists || []);
      if (defaultWaitlistId) {
        reset((v) => ({ ...v, waitlistId: defaultWaitlistId }));
      } else if ((j.waitlists || []).length > 0) {
        reset((v) => ({ ...v, waitlistId: j.waitlists[0].id }));
      }
      setFetching(false);
      // Focus the name field when modal opens
      try { setTimeout(() => setFocus("customerName"), 50); } catch { }
    })();
  }, [reset, defaultWaitlistId, isPublic, publicConfig, setFocus]);

  useEffect(() => {
    if (isPublic) return;
    (async () => {
      try {
        const res = await fetch("/api/plan", { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json().catch(() => ({}));
        const used = Number(j?.usage?.sms?.used);
        const limit = Number(j?.usage?.sms?.limit);
        if (Number.isFinite(used) && Number.isFinite(limit)) {
          setSmsUsage({
            used,
            limit,
            windowEnd: typeof j?.usage?.window?.end === "string" ? j.usage.window.end : undefined,
          });
        }
      } catch { }
    })();
  }, [isPublic]);

  const current = waitlists.find(w => w.id === watch("waitlistId"));
  const blockedReason = current?.location_is_open === false ? (current.location_status_reason || "Restaurant is closed") : null;
  useEffect(() => {
    onBlockedReasonChange?.(blockedReason);
  }, [blockedReason, onBlockedReasonChange]);

  const smsLimitReached = typeof smsUsage?.used === "number" && typeof smsUsage?.limit === "number" && smsUsage.used >= smsUsage.limit;
  useEffect(() => {
    if (smsLimitReached) {
      setValue("sendSms", false);
    }
  }, [smsLimitReached, setValue]);

  const onSubmit = (values: FormValues) => {
    setMessage(null);
    // Client-side guard (server will also enforce): avoid sending when location is closed.
    if (blockedReason) {
      setMessage(blockedReason);
      return;
    }
    startTransition(async () => {
      if (isPublic) {
        if (!publicConfig?.displayToken) {
          setMessage("Unable to add right now.");
          return;
        }
        const res = await fetch("/api/display/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: publicConfig.displayToken,
            phone: values.phone || undefined,
            name: values.customerName || undefined,
            email: values.email || undefined,
            partySize: values.partySize,
            seatingPreference: values.seatingPreference,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (res.ok) {
          reset({ phone: "", email: "", customerName: "", waitlistId: values.waitlistId, sendSms: false, sendEmail: false, partySize: 2, seatingPreference: undefined });
          setMessage(null);
          onPublicSuccess?.({ statusUrl: j?.statusUrl, ticketNumber: j?.ticketNumber });
          return;
        }
        if (res.status === 409) {
          const errStr = typeof j?.error === "string" ? j.error : "This person is already waiting.";
          setDuplicateDialog({ open: true, message: errStr });
          return;
        }
        const errStr = typeof j?.error === "string" ? j.error : "Failed to add";
        let hasFieldErrors = false;
        if (/phone/i.test(errStr)) {
          setError("phone", { type: "server", message: errStr });
          hasFieldErrors = true;
        }
        if (/name/i.test(errStr)) {
          setError("customerName", { type: "server", message: errStr });
          hasFieldErrors = true;
        }
        if (/email/i.test(errStr)) {
          setError("email", { type: "server", message: errStr });
          hasFieldErrors = true;
        }
        if (!hasFieldErrors) setMessage(errStr);
        return;
      }

      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        const ticketNumber = typeof j?.ticketNumber === "number" ? j.ticketNumber : null;
        toastManager.add({
          title: "Success",
          description: `Customer added to waitlist successfully${typeof ticketNumber === "number" ? ` #${ticketNumber}` : ""}`,
          type: "success",
        });
        reset({ phone: "", email: "", customerName: "", waitlistId: values.waitlistId, sendSms: false, sendEmail: false, partySize: 2, seatingPreference: undefined });
        setMessage("Added and message sent (if configured)");
        // Local optimistic refresh and broadcast
        try {
          window.dispatchEvent(new CustomEvent('wl:refresh', { detail: { waitlistId: values.waitlistId } }));
        } catch { }
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const sb = createClient();
          const ch = sb.channel(`waitlist-entries-${values.waitlistId}`);
          ch.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              try { await ch.send({ type: 'broadcast', event: 'refresh', payload: {} }); } catch { }
              try { sb.removeChannel(ch); } catch { }
            }
          });
        } catch { }
        onDone?.();
      } else {
        if (res.status === 409) {
          const j = await res.json().catch(() => ({}));
          const errStr = typeof j?.error === "string" ? j.error : "This person is already waiting.";
          setDuplicateDialog({ open: true, message: errStr });
          return;
        }
        let parsed: unknown = {};
        try {
          parsed = await res.json();
        } catch { }
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
                    field === 'email' ? 'email' :
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

  if (fetching) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading...
      </div>
    );
  }

  const collectPhone = current?.ask_phone !== false;
  const collectEmail = current?.ask_email === true;

  return (
    <div>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        {blockedReason ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {blockedReason}
          </div>
        ) : null}
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
        {(waitlists.find(w => w.id === watch("waitlistId"))?.ask_name !== false) && (
          <div className="grid gap-2">
            <label className="text-sm font-medium">Customer name</label>
            <input className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm" placeholder="Full name" {...register("customerName", { required: true })} />
            {errors.customerName && (
              <p className="text-sm text-red-600">{errors.customerName.message}</p>
            )}
          </div>
        )}
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
          {collectPhone && (
            <div className="flex-1 grid gap-2">
              <label className="text-sm font-medium">Phone</label>
              <PhoneInput
                defaultCountry={businessCountry}
                value={watch("phone")}
                onChange={(value) => setValue("phone", value)}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          )}
        </div>

        {collectEmail ? (
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
              placeholder="name@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        ) : null}
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
        {!isPublic && (collectPhone || collectEmail) && (
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Notify via</label>
            {collectPhone ? (
              <div className="flex items-center gap-2">
                <input id="send-sms" type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-ring disabled:opacity-50" disabled={smsLimitReached} {...register("sendSms")} />
                <label htmlFor="send-sms" className="text-sm">SMS</label>
              </div>
            ) : null}
            {collectEmail ? (
              <div className="flex items-center gap-2">
                <input id="send-email" type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-ring" {...register("sendEmail")} />
                <label htmlFor="send-email" className="text-sm">Email</label>
              </div>
            ) : null}
          </div>
        )}
        {!isPublic && collectPhone && smsLimitReached ? (
          <p className="text-xs text-muted-foreground">SMS limit reached for the current billing period.</p>
        ) : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </form>
      <AlertDialog open={duplicateDialog.open} onOpenChange={(open) => setDuplicateDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Already waiting</AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateDialog.message || "This customer is already waiting in this list."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


