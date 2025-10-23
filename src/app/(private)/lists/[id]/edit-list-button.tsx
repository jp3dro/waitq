"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import Modal from "@/components/modal";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import Dropdown from "@/components/dropdown";
import { toastManager } from "@/hooks/use-toast";

type Location = { id: string; name: string };

export default function EditListButton({
  waitlistId,
  initialName,
  initialLocationId,
  locations,
  initialKioskEnabled = false,
  triggerId,
  hideTrigger = false,
  controlledOpen,
  onOpenChange,
}: {
  waitlistId: string;
  initialName: string;
  initialLocationId?: string;
  locations: Location[];
  initialKioskEnabled?: boolean;
  triggerId?: string;
  hideTrigger?: boolean;
  controlledOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [locationId, setLocationId] = useState(initialLocationId || locations[0]?.id || "");
  const [kioskEnabled, setKioskEnabled] = useState<boolean>(initialKioskEnabled);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  // If parent controls open state, reset fields when opening
  useEffect(() => {
    if (typeof controlledOpen === 'boolean') {
      if (controlledOpen) {
        setName(initialName);
        setLocationId(initialLocationId || locations[0]?.id || "");
        setKioskEnabled(initialKioskEnabled);
        setMessage(null);
      }
    }
  }, [controlledOpen, initialName, initialLocationId, initialKioskEnabled, locations]);

  const setOpen = (v: boolean) => {
    if (typeof controlledOpen === 'boolean' && onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };

  const getOpen = () => (typeof controlledOpen === 'boolean' ? controlledOpen : internalOpen);

  const openModal = () => {
    setOpen(true);
    setName(initialName);
    setLocationId(initialLocationId || locations[0]?.id || "");
    setKioskEnabled(initialKioskEnabled);
    setMessage(null);
  };

  const closeModal = () => {
    setOpen(false);
    setName(initialName);
    setLocationId(initialLocationId || locations[0]?.id || "");
    setKioskEnabled(initialKioskEnabled);
    setMessage(null);
  };

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const payload: { id: string; name?: string; locationId?: string; kioskEnabled?: boolean } = { id: waitlistId };

      // Only include fields that have changed
      if (name !== initialName) {
        payload.name = name;
      }
      if (locationId !== (initialLocationId || locations[0]?.id || "")) {
        payload.locationId = locationId;
      }
      payload.kioskEnabled = kioskEnabled;

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
      <button id={triggerId} onClick={openModal} className="action-btn" style={hideTrigger ? { display: 'none' } : undefined}>
        Edit
      </button>
      <Modal
        open={getOpen()}
        onClose={closeModal}
        title="Edit list"
        footer={
          <>
            <button
              onClick={closeModal}
              className="action-btn"
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              onClick={save}
              className="action-btn action-btn--primary disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Location</label>
            <Dropdown
              value={locationId}
              onChange={setLocationId}
              options={locations.map((l) => ({ value: l.id, label: l.name }))}
              disabled={isPending}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch id="kiosk-enabled" checked={kioskEnabled} onCheckedChange={setKioskEnabled} />
            <div className="flex items-center gap-2">
              <label htmlFor="kiosk-enabled" className="text-sm font-medium">Self-checkin kiosk</label>
              <Tooltip content="Users will be able to add themselves to the waiting list using your welcome Kiosk screen">
                <Info className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
              </Tooltip>
            </div>
          </div>
          {message ? <p className="text-sm text-red-700">{message}</p> : null}
        </div>
      </Modal>
    </>
  );
}


