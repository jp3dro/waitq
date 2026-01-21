"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
  const [displayShowQr, setDisplayShowQr] = useState(false);
  const [seatingPrefs, setSeatingPrefs] = useState<string[]>([]);
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
    setDisplayShowQr(false);
    setSeatingPrefs([]);
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
          displayEnabled,
          displayShowName,
          displayShowQr,
          askName,
          askPhone,
          askEmail,
          seatingPreferences: seatingPrefs,
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create list</DialogTitle>
          </DialogHeader>

          <>
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
              displayShowQr={displayShowQr}
              onDisplayShowQrChange={setDisplayShowQr}
              kioskEnabled={kioskEnabled}
              onKioskEnabledChange={setKioskEnabled}
              seatingPrefs={seatingPrefs}
              onSeatingPrefsChange={setSeatingPrefs}
            />
            {message ? <p className="text-sm text-destructive">{message}</p> : null}
          </>

          <DialogFooter>
            <Button disabled={isPending} onClick={onCreate}>
              {isPending ? "Creating…" : "Create"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


