"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
      <Button
        id={triggerId}
        onClick={openModal}
        variant="outline"
        size="sm"
        style={hideTrigger ? { display: "none" } : undefined}
      >
        Edit
      </Button>

      <Dialog open={getOpen()} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit list</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Location</Label>
              <Select value={locationId} onValueChange={setLocationId} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Switch id="kiosk-enabled" checked={kioskEnabled} onCheckedChange={setKioskEnabled} />
              <div className="flex items-center gap-2">
                <Label htmlFor="kiosk-enabled">Self-checkin kiosk</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Users will be able to add themselves to the waiting list using your welcome Kiosk screen.
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            {message ? <p className="text-sm text-destructive">{message}</p> : null}
          </div>

          <DialogFooter>
            <Button disabled={isPending} onClick={save}>
              {isPending ? "Saving…" : "Save"}
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


