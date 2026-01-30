"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/hooks/use-toast";
import ListFormFields, { type ListType } from "@/app/(private)/lists/list-form-fields";

type Location = { id: string; name: string };

export default function EditListButton({
  waitlistId,
  initialName,
  initialLocationId,
  locations,
  initialKioskEnabled = false,
  initialKioskQrEnabled = false,
  initialAskName = true,
  initialAskPhone = true,
  initialAskEmail = false,
  initialSeatingPreferences = [],
  initialDisplayEnabled = true,
  initialDisplayShowName = true,
  initialDisplayShowQr = false,
  initialAverageWaitMinutes = null,
  initialListType = "eat_in",
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
  initialKioskQrEnabled?: boolean;
  initialDisplayEnabled?: boolean;
  initialDisplayShowName?: boolean;
  initialDisplayShowQr?: boolean;
  initialAskName?: boolean;
  initialAskPhone?: boolean;
  initialAskEmail?: boolean;
  initialSeatingPreferences?: string[];
  initialAverageWaitMinutes?: number | null;
  initialListType?: ListType;
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
  // kioskQrEnabled is now a separate field from displayShowQr
  const [kioskQrEnabled, setKioskQrEnabled] = useState<boolean>(initialKioskQrEnabled);
  const [displayShowQr, setDisplayShowQr] = useState<boolean>(initialDisplayShowQr);
  const [askName, setAskName] = useState<boolean>(initialAskName);
  const [askPhone, setAskPhone] = useState<boolean>(initialAskPhone);
  const [askEmail, setAskEmail] = useState<boolean>(initialAskEmail);
  const [averageWaitMinutes, setAverageWaitMinutes] = useState<number | null>(initialAverageWaitMinutes);
  const [listType, setListType] = useState<ListType>(initialListType);
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

  // When parent controlled open state transitions to true, reset fields
  const prevControlledOpen = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (typeof controlledOpen === 'boolean') {
      if (controlledOpen && !prevControlledOpen.current) {
        setName(initialName);
        setLocationId(initialLocationId || locations[0]?.id || "");
        setKioskEnabled(initialKioskEnabled);
        setDisplayEnabled(initialDisplayEnabled);
        setDisplayShowName(initialDisplayShowName);
        setKioskQrEnabled(initialKioskQrEnabled);
        setDisplayShowQr(initialDisplayShowQr);
        setAskName(initialAskName);
        setAskPhone(initialAskPhone);
        setAskEmail(initialAskEmail);
        setAverageWaitMinutes(initialAverageWaitMinutes);
        setListType(initialListType);
        setMessage(null);
      }
      prevControlledOpen.current = controlledOpen;
    }
  }, [controlledOpen, initialName, initialLocationId, initialKioskEnabled, initialKioskQrEnabled, initialDisplayEnabled, initialDisplayShowName, initialDisplayShowQr, initialAskName, initialAskPhone, initialAskEmail, initialAverageWaitMinutes, initialListType, locations]);

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
    setKioskQrEnabled(initialKioskQrEnabled);
    setDisplayShowQr(initialDisplayShowQr);
    setAskName(initialAskName);
    setAskPhone(initialAskPhone);
    setAskEmail(initialAskEmail);
    setAverageWaitMinutes(initialAverageWaitMinutes);
    setListType(initialListType);
    setMessage(null);
  };

  const closeModal = () => {
    setOpen(false);
    setName(initialName);
    setLocationId(initialLocationId || locations[0]?.id || "");
    setKioskEnabled(initialKioskEnabled);
    setDisplayEnabled(initialDisplayEnabled);
    setDisplayShowName(initialDisplayShowName);
    setKioskQrEnabled(initialKioskQrEnabled);
    setDisplayShowQr(initialDisplayShowQr);
    setAskName(initialAskName);
    setAskPhone(initialAskPhone);
    setAskEmail(initialAskEmail);
    setAverageWaitMinutes(initialAverageWaitMinutes);
    setListType(initialListType);
    setMessage(null);
  };

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const payload: { id: string; name?: string; locationId?: string; kioskEnabled?: boolean; kioskQrEnabled?: boolean; displayEnabled?: boolean; displayShowName?: boolean; displayShowQr?: boolean; askName?: boolean; askPhone?: boolean; askEmail?: boolean; averageWaitMinutes?: number | null; listType?: ListType } = { id: waitlistId };

      // Only include fields that have changed
      if (name !== initialName) {
        payload.name = name;
      }
      if (locationId !== (initialLocationId || locations[0]?.id || "")) {
        payload.locationId = locationId;
      }
      payload.kioskEnabled = kioskEnabled;
      payload.kioskQrEnabled = kioskQrEnabled;
      payload.displayEnabled = displayEnabled;
      payload.displayShowName = displayEnabled ? displayShowName : false;
      payload.displayShowQr = displayEnabled && kioskQrEnabled ? displayShowQr : false;
      payload.askName = askName;
      payload.askPhone = askPhone;
      payload.askEmail = askEmail;
      payload.averageWaitMinutes = averageWaitMinutes;
      payload.listType = listType;

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
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <div className="flex max-h-[90vh] flex-col">
            <div className="min-h-12 h-12 shrink-0 border-b border-border px-6 flex items-center">
              <DialogHeader>
                <DialogTitle className="truncate">Edit list</DialogTitle>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid gap-4">
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
                  listType={listType}
                  onListTypeChange={setListType}
                />
                {message ? <p className="text-sm text-destructive">{message}</p> : null}
              </div>
            </div>

            <div className="sticky bottom-0 min-h-12 h-12 shrink-0 border-t border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center">
              <div className="ml-auto flex items-center gap-2">
                <Button onClick={closeModal} variant="outline">
                  Cancel
                </Button>
                <Button disabled={isPending} onClick={save}>
                  {isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
