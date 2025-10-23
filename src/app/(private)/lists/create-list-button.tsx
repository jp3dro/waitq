"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import Modal from "@/components/modal";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { toastManager } from "@/hooks/use-toast";
import Dropdown from "@/components/dropdown";

export default function CreateListButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [listType, setListType] = useState("restaurants");
  const [kioskEnabled, setKioskEnabled] = useState(false);
  const [seatingPrefs, setSeatingPrefs] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setListType("restaurants");
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
        body: JSON.stringify({ name: n, kioskEnabled, listType, seatingPreferences: seatingPrefs }),
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
      <button onClick={() => setOpen(true)} className="action-btn action-btn--primary text-xs">Create list</button>
      <Modal
        open={open}
        onClose={() => { setOpen(false); reset(); }}
        title="Create list"
        footer={
          <>
            <button onClick={() => { setOpen(false); reset(); }} className="action-btn">Cancel</button>
            <button disabled={isPending} onClick={onCreate} className="action-btn action-btn--primary disabled:opacity-50">{isPending ? "Creating…" : "Create"}</button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm" placeholder="Enter list name" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Type</label>
            <Dropdown
              value={listType}
              onChange={setListType}
              options={[
                { value: "restaurants", label: "Restaurants" },
                { value: "barber_shops", label: "Barber shops (coming soon)" },
                { value: "beauty_salons", label: "Beauty salons (coming soon)" },
                { value: "massages", label: "Massages (coming soon)" },
                { value: "clinics", label: "Clinics and medical (coming soon)" },
                { value: "warehouse_transport", label: "Warehouse & transport (coming soon)" },
                { value: "hotels", label: "Hotels & accommodations (coming soon)" },
                { value: "public_services", label: "Public services (coming soon)" },
              ]}
            />
          </div>
          {listType === "restaurants" ? (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Seating preferences</label>
              <SeatingPrefsEditor value={seatingPrefs} onChange={setSeatingPrefs} />
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            <Switch id="kiosk-enabled" checked={kioskEnabled} onCheckedChange={setKioskEnabled} />
            <div className="flex items-center gap-2">
              <label htmlFor="kiosk-enabled" className="text-sm font-medium">Self-checkin kiosk</label>
              <Tooltip content="Users will be able to add themselves to the waiting list using your welcome Kiosk screen">
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </Tooltip>
            </div>
          </div>
          {message ? <p className="text-sm text-destructive">{message}</p> : null}
        </div>
      </Modal>
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
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 block rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm" placeholder="Add seating preference" />
        <button type="button" onClick={add} className="action-btn action-btn--primary text-xs">Add</button>
      </div>
      {value.length ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((v) => (
            <li key={v} className="inline-flex items-center gap-2 rounded-full ring-1 ring-inset ring-border px-3 py-1 text-xs">
              <span>{v}</span>
              <button type="button" onClick={() => remove(v)} className="text-muted-foreground hover:opacity-90">✕</button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}


