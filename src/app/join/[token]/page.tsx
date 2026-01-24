"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Country } from "@/components/ui/phone-input";
import AddForm from "@/app/(private)/dashboard/waitlist-add-form";

type Payload = {
  listId: string;
  listName: string;
  locationIsOpen?: boolean;
  locationStatusReason?: string | null;
  askName?: boolean;
  askPhone?: boolean;
  askEmail?: boolean;
  businessCountry?: string | null;
  businessName?: string | null;
  brandLogo?: string | null;
  seatingPreferences?: string[];
  estimatedMs?: number;
};

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  // Public pages should follow the user's OS theme by default.
  useEffect(() => {
    setTheme("system");
  }, [setTheme]);

  useEffect(() => {
    params.then(({ token: t }) => setToken(t));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/display?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!res.ok) {
          setData(null);
          setLoading(false);
          return;
        }
        const j = (await res.json()) as Payload;
        setData(j);
      } catch {
        setData(null);
      }
      setLoading(false);
    })();
  }, [token]);

  const formatDuration = (ms: number) => {
    const totalMin = Math.max(0, Math.round(ms / 60000));
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const initials = (() => {
    const raw = (data?.businessName || "").trim();
    if (!raw) return "WQ";
    const parts = raw.split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return raw.slice(0, 2).toUpperCase();
  })();

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!data || !token) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold">Unable to load</h1>
          <p className="mt-2 text-muted-foreground">This waitlist link may be invalid or expired.</p>
        </div>
      </main>
    );
  }

  const locationIsOpen = data.locationIsOpen !== false;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1 flex flex-col px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-md flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center">
              {data.brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.brandLogo} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-muted-foreground">{initials}</span>
              )}
            </div>
            <div className="flex flex-col">
              {data.businessName ? (
                <p className="text-sm font-medium text-muted-foreground leading-none mb-1">{data.businessName}</p>
              ) : null}
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-none">{data.listName}</h1>
            </div>
          </div>

          {/* Closed warning */}
          {!locationIsOpen ? (
            <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3">
              <div className="font-semibold">Currently closed</div>
              <div className="text-sm opacity-90">{data.locationStatusReason || "This location is currently closed."}</div>
            </div>
          ) : null}

          {/* Estimated wait time */}
          {typeof data.estimatedMs === "number" && locationIsOpen ? (
            <div className="mb-6 rounded-xl bg-muted/50 ring-1 ring-border p-4">
              <p className="text-sm text-muted-foreground">Estimated wait time</p>
              <p className="mt-1 text-2xl font-semibold">{formatDuration(data.estimatedMs)}</p>
            </div>
          ) : null}

          {/* Form */}
          <div className="flex-1">
            <div className="bg-card ring-1 ring-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Join the waitlist</h2>
              <AddForm
                formId="join-waitlist-form"
                businessCountry={(data.businessCountry || "PT") as Country}
                lockWaitlist
                mode="public"
                publicConfig={{
                  displayToken: token,
                  waitlist: {
                    id: data.listId,
                    name: data.listName,
                    ask_name: data.askName,
                    ask_phone: data.askPhone,
                    ask_email: data.askEmail,
                    seating_preferences: data.seatingPreferences,
                    location_is_open: data.locationIsOpen,
                    location_status_reason: data.locationStatusReason || null,
                  },
                }}
                onPendingChange={setIsPending}
                onPublicSuccess={({ statusUrl: url }) => {
                  // Auto-redirect to status page
                  if (url) {
                    router.push(url);
                  }
                }}
              />
              <div className="mt-6">
                <Button
                  type="submit"
                  form="join-waitlist-form"
                  className="w-full h-14 text-lg"
                  disabled={!locationIsOpen || isPending}
                >
                  {isPending ? "Joining..." : "Join waitlist"}
                </Button>
              </div>
            </div>

            {/* Footer - closer to form */}
            <div className="mt-6 flex items-center justify-center gap-1">
              <span className="text-xs font-medium text-muted-foreground">Powered by</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/waitq.svg" alt="WaitQ" className="h-4 w-auto logo-light" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/waitq-variant.svg" alt="WaitQ" className="h-4 w-auto logo-dark" />
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={duplicateDialog.open} onOpenChange={(open) => setDuplicateDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent showCloseButton={false}>
          <AlertDialogHeader>
            <AlertDialogTitle>Already waiting</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogBody>
            <AlertDialogDescription>
              {duplicateDialog.message || "This person is already waiting in this list."}
            </AlertDialogDescription>
          </AlertDialogBody>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
