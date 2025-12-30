"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toastManager } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateListButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [kioskEnabled, setKioskEnabled] = useState(false);
  const [seatingPrefs, setSeatingPrefs] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setKioskEnabled(false);
    setSeatingPrefs([]);
    setMessage(null);
  };

  const onCreate = () => {
    setMessage(null);
    startTransition(async () => {
      const n = name.trim();
      if (!n) return;
      const res = await fetch("/api/waitlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, kioskEnabled, seatingPreferences: seatingPrefs }),
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

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter list name" />
            </div>

            <div className="grid gap-2">
              <Label>Seating preferences</Label>
              <SeatingPrefsEditor value={seatingPrefs} onChange={setSeatingPrefs} />
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

function SeatingPrefsEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (value.includes(v)) return;
    onChange([...value, v]);
    setInput("");
  };
  const remove = (v: string) => onChange(value.filter((x) => x !== v));
  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add seating preference" />
        <Button type="button" onClick={add} size="sm">
          Add
        </Button>
      </div>
      {value.length ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((v) => (
            <li key={v} className="inline-flex items-center gap-2 rounded-full ring-1 ring-inset ring-border px-3 py-1 text-xs">
              <span>{v}</span>
              <button type="button" onClick={() => remove(v)} className="text-muted-foreground hover:opacity-90">
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}


