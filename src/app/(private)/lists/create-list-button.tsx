"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/modal";
import toast from "react-hot-toast";

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
        toast.success("List created successfully!");
      } else {
        setMessage(j?.error ?? "Failed to create");
      }
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-neutral-800">Create list</button>
      <Modal open={open} onClose={() => { setOpen(false); reset(); }} title="Create list">
        <div className="grid gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-[#FF9500] px-3 py-2 text-sm" placeholder="Enter list name" />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Type</label>
            <select value={listType} onChange={(e) => setListType(e.target.value)} className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-[#FF9500] pl-3 pr-10 py-2 text-sm">
              <option value="restaurants">Restaurants</option>
              <option value="barber_shops" disabled>Barber shops (coming soon)</option>
              <option value="beauty_salons" disabled>Beauty salons (coming soon)</option>
              <option value="massages" disabled>Massages (coming soon)</option>
              <option value="clinics" disabled>Clinics and medical (coming soon)</option>
              <option value="warehouse_transport" disabled>Warehouse & transport (coming soon)</option>
              <option value="hotels" disabled>Hotels & accommodations (coming soon)</option>
              <option value="public_services" disabled>Public services (coming soon)</option>
            </select>
          </div>
          {listType === "restaurants" ? (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Seating preferences</label>
              <SeatingPrefsEditor value={seatingPrefs} onChange={setSeatingPrefs} />
            </div>
          ) : null}
          <div className="grid gap-1">
            <label className="text-sm font-medium">Self-checkin kiosk</label>
            <div className="flex items-start gap-3">
              <input id="kiosk-enabled" type="checkbox" checked={kioskEnabled} onChange={(e) => setKioskEnabled(e.target.checked)} className="mt-1 h-4 w-4 rounded border-neutral-300 text-black focus:ring-[#FF9500] checked:bg-[#FF9500]" />
              <label htmlFor="kiosk-enabled" className="text-sm text-neutral-700">Users will be able to add themselves to the waiting list using your welcome Kiosk screen</label>
            </div>
          </div>
          <div className="flex justify-between">
            <button disabled={isPending} onClick={onCreate} className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50">{isPending ? "Creating…" : "Create"}</button>
            <button onClick={() => { setOpen(false); reset(); }} className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50">Cancel</button>
            {message ? <p className="mt-2 text-sm text-red-700">{message}</p> : null}
          </div>
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
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 block rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-[#FF9500] px-3 py-2 text-sm" placeholder="Add seating preference" />
        <button type="button" onClick={add} className="inline-flex items-center rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800">Add</button>
      </div>
      {value.length ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((v) => (
            <li key={v} className="inline-flex items-center gap-2 rounded-full ring-1 ring-inset ring-neutral-300 px-3 py-1 text-xs">
              <span>{v}</span>
              <button type="button" onClick={() => remove(v)} className="text-neutral-500 hover:text-neutral-700">✕</button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}


