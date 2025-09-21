"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import Modal from "@/components/modal";

type Location = { id: string; name: string; phone: string | null; address: string | null; city: string | null };

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; phone: string; address: string; city: string }>({ name: "", phone: "", address: "", city: "" });
  const [openCreate, setOpenCreate] = useState(false);
  const [edit, setEdit] = useState<Location | null>(null);

  async function load() {
    const res = await fetch("/api/locations", { cache: "no-store" });
    const j = await res.json();
    setLocations(j.locations || []);
  }

  useEffect(() => {
    load();
  }, []);

  const canDelete = useMemo(() => locations.length > 1, [locations.length]);

  const create = () => {
    startTransition(async () => {
      setMsg(null);
      const name = form.name.trim();
      if (!name) return;
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: form.phone.trim() || null, address: form.address.trim() || null, city: form.city.trim() || null }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setForm({ name: "", phone: "", address: "", city: "" });
        setOpenCreate(false);
        await load();
      } else {
        setMsg(j?.error ?? "Failed to create");
      }
    });
  };

  const update = (id: string, updates: Partial<Omit<Location, "id">>) => {
    startTransition(async () => {
      setMsg(null);
      const res = await fetch("/api/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setEdit(null);
        await load();
      } else {
        setMsg(j?.error ?? "Failed to update");
      }
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      setMsg(null);
      if (!canDelete) return;
      const res = await fetch(`/api/locations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        await load();
      } else {
        setMsg(j?.error ?? "Failed to delete");
      }
    });
  };

  return (
    <>
    <div className="bg-white ring-1 ring-black/5 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Locations</h2>
        <button onClick={() => setOpenCreate(true)} className="inline-flex items-center rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white shadow-sm">New</button>
      </div>
      {msg ? <p className="mt-2 text-sm text-red-700">{msg}</p> : null}
      <ul className="mt-4 divide-y">
        {locations.map((l) => (
          <li key={l.id} className="py-3 grid md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center">
            <span className="text-sm">{l.name}</span>
            <span className="text-sm">{l.phone || "—"}</span>
            <span className="text-sm">{l.address || "—"}</span>
            <span className="text-sm">{l.city || "—"}</span>
            <div className="justify-self-end flex items-center gap-2">
              <button onClick={() => setEdit(l)} className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50">Edit</button>
              {canDelete ? (
                <button disabled={isPending} onClick={() => remove(l.id)} className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50">Delete</button>
              ) : (
                <span className="text-xs text-neutral-500">At least one required</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>

    {/* Create Modal */}
    <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="New location">
      <div className="grid gap-3">
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" className="rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 px-3 py-2 text-sm" />
        <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 px-3 py-2 text-sm" />
        <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Address" className="rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 px-3 py-2 text-sm" />
        <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="City" className="rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 px-3 py-2 text-sm" />
        <div className="flex justify-end gap-2">
          <button onClick={() => setOpenCreate(false)} className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50">Cancel</button>
          <button onClick={create} disabled={isPending || !form.name.trim()} className="inline-flex items-center rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white shadow-sm disabled:opacity-50">Create</button>
        </div>
      </div>
    </Modal>

    {/* Edit Modal */}
    <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit location">
      {edit ? (
        <div className="grid gap-3">
          <input defaultValue={edit.name || ""} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== edit.name) update(edit.id, { name: v }); }} placeholder="Name" className="rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 px-3 py-2 text-sm" />
          <input defaultValue={edit.phone || ""} onBlur={(e) => { const v = e.target.value.trim(); if (v !== (edit.phone || "")) update(edit.id, { phone: v || null }); }} placeholder="Phone" className="rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 px-3 py-2 text-sm" />
          <input defaultValue={edit.address || ""} onBlur={(e) => { const v = e.target.value.trim(); if (v !== (edit.address || "")) update(edit.id, { address: v || null }); }} placeholder="Address" className="rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 px-3 py-2 text-sm" />
          <input defaultValue={edit.city || ""} onBlur={(e) => { const v = e.target.value.trim(); if (v !== (edit.city || "")) update(edit.id, { city: v || null }); }} placeholder="City" className="rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 px-3 py-2 text-sm" />
          <div className="flex justify-end">
            <button onClick={() => setEdit(null)} className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50">Close</button>
          </div>
        </div>
      ) : null}
    </Modal>
    </>
  );
}


