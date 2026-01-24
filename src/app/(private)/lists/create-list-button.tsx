"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toastManager } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import ListFormFields from "@/app/(private)/lists/list-form-fields";

type Location = { id: string; name: string };

export default function CreateListButton({ locations }: { locations: Location[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [locationId, setLocationId] = useState<string>(locations[0]?.id || "");
  const [kioskEnabled, setKioskEnabled] = useState(true);
  const [askName, setAskName] = useState(true);
  const [askPhone, setAskPhone] = useState(true);
  const [askEmail, setAskEmail] = useState(false);
  const [displayEnabled, setDisplayEnabled] = useState(true);
  const [displayShowName, setDisplayShowName] = useState(true);
  const [kioskQrEnabled, setKioskQrEnabled] = useState(false);
  const [displayShowQr, setDisplayShowQr] = useState(false);
  const [averageWaitMinutes, setAverageWaitMinutes] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setNameError(false);
    setLocationId(locations[0]?.id || "");
    setKioskEnabled(true);
    setAskName(true);
    setAskPhone(true);
    setAskEmail(false);
    setDisplayEnabled(true);
    setDisplayShowName(true);
    setKioskQrEnabled(false);
    setDisplayShowQr(false);
    setAverageWaitMinutes(null);
    setMessage(null);
  };

  const onCreate = () => {
    setMessage(null);
    setNameError(false);
    startTransition(async () => {
      const n = name.trim();
      if (!n) {
        setNameError(true);
        return;
      }
      const res = await fetch("/api/waitlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: n,
          locationId: locationId || undefined,
          kioskEnabled,
          kioskQrEnabled,
          displayEnabled,
          displayShowName,
          displayShowQr,
          askName,
          askPhone,
          askEmail,
          averageWaitMinutes: averageWaitMinutes || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setOpen(false);
        reset();
        try { window.dispatchEvent(new CustomEvent('wl:refresh', { detail: {} })); } catch {}
        // Refresh server component page to show the new list immediately
        try { router.refresh(); } catch {}
        toastManager.add({
          title: "Success",
          description: "List created successfully!",
          type: "success",
        });
      } else {
        setMessage(j?.error ?? "Failed to create");
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        Create list
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <div className="flex max-h-[90vh] flex-col">
            <div className="h-12 border-b border-border px-6 flex items-center">
              <DialogHeader>
                <DialogTitle className="truncate">Create list</DialogTitle>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid gap-4">
                <ListFormFields
                  name={name}
                  onNameChange={(v) => {
                    setName(v);
                    if (nameError && v.trim()) setNameError(false);
                  }}
                  nameError={nameError ? "Name is required." : null}
                  locationId={locationId}
                  onLocationChange={setLocationId}
                  locations={locations}
                  isPending={isPending}
                  askName={askName}
                  onAskNameChange={setAskName}
                  askPhone={askPhone}
                  onAskPhoneChange={setAskPhone}
                  askEmail={askEmail}
                  onAskEmailChange={setAskEmail}
                  displayEnabled={displayEnabled}
                  onDisplayEnabledChange={setDisplayEnabled}
                  displayShowName={displayShowName}
                  onDisplayShowNameChange={setDisplayShowName}
                  kioskQrEnabled={kioskQrEnabled}
                  onKioskQrEnabledChange={(v) => {
                    setKioskQrEnabled(v);
                    // When disabling QR, also disable showing it on display
                    if (!v) setDisplayShowQr(false);
                  }}
                  displayShowQr={displayShowQr}
                  onDisplayShowQrChange={setDisplayShowQr}
                  kioskEnabled={kioskEnabled}
                  onKioskEnabledChange={setKioskEnabled}
                  averageWaitMinutes={averageWaitMinutes}
                  onAverageWaitMinutesChange={setAverageWaitMinutes}
                />
                {message ? <p className="text-sm text-destructive">{message}</p> : null}
              </div>
            </div>

            <div className="sticky bottom-0 h-12 border-t border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center">
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button disabled={isPending} onClick={onCreate}>
                  {isPending ? "Creating…" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


