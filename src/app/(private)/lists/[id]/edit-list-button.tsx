"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/hooks/use-toast";
import ListFormFields from "@/app/(private)/lists/list-form-fields";

type Location = { id: string; name: string };

const EMPTY_SEATING: string[] = [];

export default function EditListButton({
  waitlistId,
  initialName,
  initialLocationId,
  locations,
  initialKioskEnabled = false,
  initialAskName = true,
  initialAskPhone = true,
  initialAskEmail = false,
  initialSeatingPreferences,
  initialDisplayEnabled = true,
  initialDisplayShowName = true,
  initialDisplayShowQr = false,
  triggerId,
  hideTrigger = false,
  buttonClassName,
  controlledOpen,
  onOpenChange,
}: {
  waitlistId: string;
  initialName: string;
  initialLocationId?: string;
  locations: Location[];
  initialKioskEnabled?: boolean;
  initialDisplayEnabled?: boolean;
  initialDisplayShowName?: boolean;
  initialDisplayShowQr?: boolean;
  initialAskName?: boolean;
  initialAskPhone?: boolean;
  initialAskEmail?: boolean;
  initialSeatingPreferences?: string[] | null;
  triggerId?: string;
  hideTrigger?: boolean;
  buttonClassName?: string;
  controlledOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [locationId, setLocationId] = useState(initialLocationId || locations[0]?.id || "");
  const [kioskEnabled, setKioskEnabled] = useState<boolean>(initialKioskEnabled);
  const [displayEnabled, setDisplayEnabled] = useState<boolean>(initialDisplayEnabled);
  const [displayShowName, setDisplayShowName] = useState<boolean>(initialDisplayShowName);
  const [displayShowQr, setDisplayShowQr] = useState<boolean>(initialDisplayShowQr);
  const [askName, setAskName] = useState<boolean>(initialAskName);
  const [askPhone, setAskPhone] = useState<boolean>(initialAskPhone);
  const [askEmail, setAskEmail] = useState<boolean>(initialAskEmail);
  const [seatingPrefs, setSeatingPrefs] = useState<string[]>(initialSeatingPreferences ?? EMPTY_SEATING);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    if (!askName && displayShowName) {
      setDisplayShowName(false);
    }
  }, [askName, displayShowName]);

  useEffect(() => {
    if (!displayEnabled && (displayShowName || displayShowQr)) {
      setDisplayShowName(false);
      setDisplayShowQr(false);
    }
  }, [displayEnabled, displayShowName, displayShowQr]);

  // If parent controls open state, reset fields when opening
  useEffect(() => {
    if (typeof controlledOpen === 'boolean') {
      if (controlledOpen) {
        setName(initialName);
        setLocationId(initialLocationId || locations[0]?.id || "");
        setKioskEnabled(initialKioskEnabled);
        setDisplayEnabled(initialDisplayEnabled);
        setDisplayShowName(initialDisplayShowName);
        setDisplayShowQr(initialDisplayShowQr);
        setAskName(initialAskName);
        setAskPhone(initialAskPhone);
        setAskEmail(initialAskEmail);
        setSeatingPrefs(initialSeatingPreferences ?? EMPTY_SEATING);
        setMessage(null);
      }
    }
  }, [controlledOpen, initialName, initialLocationId, initialKioskEnabled, initialDisplayEnabled, initialDisplayShowName, initialDisplayShowQr, initialAskName, initialAskPhone, initialAskEmail, initialSeatingPreferences, locations]);

  const open = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
  // Radix Dialog may re-run effects when `onOpenChange` identity changes.
  // Keep this handler stable across internal state updates to avoid update loops.
  const setOpen = useCallback(
    (v: boolean) => {
      if (typeof controlledOpen === "boolean") onOpenChange?.(v);
      else setInternalOpen(v);
    },
    [controlledOpen, onOpenChange]
  );

  const openModal = () => {
    setOpen(true);
    setName(initialName);
    setLocationId(initialLocationId || locations[0]?.id || "");
    setKioskEnabled(initialKioskEnabled);
    setDisplayEnabled(initialDisplayEnabled);
    setDisplayShowName(initialDisplayShowName);
    setDisplayShowQr(initialDisplayShowQr);
    setAskName(initialAskName);
    setAskPhone(initialAskPhone);
    setAskEmail(initialAskEmail);
    setSeatingPrefs(initialSeatingPreferences ?? EMPTY_SEATING);
    setMessage(null);
  };

  const closeModal = () => {
    setOpen(false);
    setName(initialName);
    setLocationId(initialLocationId || locations[0]?.id || "");
    setKioskEnabled(initialKioskEnabled);
    setDisplayEnabled(initialDisplayEnabled);
    setDisplayShowName(initialDisplayShowName);
    setDisplayShowQr(initialDisplayShowQr);
    setAskName(initialAskName);
    setAskPhone(initialAskPhone);
    setAskEmail(initialAskEmail);
    setSeatingPrefs(initialSeatingPreferences ?? EMPTY_SEATING);
    setMessage(null);
  };

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const payload: { id: string; name?: string; locationId?: string; kioskEnabled?: boolean; displayEnabled?: boolean; displayShowName?: boolean; displayShowQr?: boolean; askName?: boolean; askPhone?: boolean; askEmail?: boolean; seatingPreferences?: string[] } = { id: waitlistId };

      // Only include fields that have changed
      if (name !== initialName) {
        payload.name = name;
      }
      if (locationId !== (initialLocationId || locations[0]?.id || "")) {
        payload.locationId = locationId;
      }
      payload.kioskEnabled = kioskEnabled;
      payload.displayEnabled = displayEnabled;
      payload.displayShowName = displayEnabled ? displayShowName : false;
      payload.displayShowQr = displayEnabled ? displayShowQr : false;
      payload.askName = askName;
      payload.askPhone = askPhone;
      payload.askEmail = askEmail;

      // Compare arrays for seating preferences
      const sameSeating =
        JSON.stringify([...seatingPrefs].sort()) === JSON.stringify([...(initialSeatingPreferences || [])].sort());
      if (!sameSeating) {
        payload.seatingPreferences = seatingPrefs;
      }

      // If no fields changed, just close modal and show success
      if (Object.keys(payload).length === 1) {
        closeModal();
        toastManager.add({
          title: "Success",
          description: "List updated successfully!",
          type: "success",
        });
        return;
      }

      const res = await fetch("/api/waitlists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        closeModal();
        router.refresh();
        toastManager.add({
          title: "Success",
          description: "List updated successfully!",
          type: "success",
        });
      } else {
        try {
          const j = await res.json();
          const err = (j && j.error) || "Failed to save";
          setMessage(typeof err === "string" ? err : "Failed to save");
        } catch {
          setMessage("Failed to save");
        }
      }
    });
  };

  return (
    <>
      <Button
        id={triggerId}
        onClick={openModal}
        variant="outline"
        size="sm"
        className={buttonClassName}
        style={hideTrigger ? { display: "none" } : undefined}
      >
        Edit
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit list</DialogTitle>
          </DialogHeader>

          <ListFormFields
            name={name}
            onNameChange={setName}
            nameError={null}
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

          <DialogFooter>
            <Button disabled={isPending} onClick={save}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
            <Button onClick={closeModal} variant="outline">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
