"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import Modal from "@/components/modal";
import toast from "react-hot-toast";

type Location = { id: string; name: string; phone: string | null; address: string | null; city: string | null };

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; phone: string; address: string; city: string }>({ name: "", phone: "", address: "", city: "" });
  const [openCreate, setOpenCreate] = useState(false);
  const [edit, setEdit] = useState<Location | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; phone: string; address: string; city: string }>({ name: "", phone: "", address: "", city: "" });
  const [editMessage, setEditMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/locations", { cache: "no-store" });
    const j = await res.json();
    setLocations(j.locations || []);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    document.title = "Locations - WaitQ";
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

  const openEditModal = (location: Location) => {
    setEdit(location);
    setEditForm({
      name: location.name,
      phone: location.phone || "",
      address: location.address || "",
      city: location.city || "",
    });
    setEditMessage(null);
  };

  const closeEditModal = () => {
    setEdit(null);
    setEditForm({ name: "", phone: "", address: "", city: "" });
    setEditMessage(null);
  };

  const saveEdit = () => {
    if (!edit) return;
    setEditMessage(null);
    startTransition(async () => {
      const updates: Partial<Omit<Location, "id">> = {};

      if (editForm.name !== edit.name) {
        updates.name = editForm.name;
      }
      if (editForm.phone !== (edit.phone || "")) {
        updates.phone = editForm.phone.trim() || null;
      }
      if (editForm.address !== (edit.address || "")) {
        updates.address = editForm.address.trim() || null;
      }
      if (editForm.city !== (edit.city || "")) {
        updates.city = editForm.city.trim() || null;
      }

      // If no fields changed, just close modal and show success
      if (Object.keys(updates).length === 0) {
        closeEditModal();
        toast.success("Location updated successfully!");
        return;
      }

      const res = await fetch("/api/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: edit.id, ...updates }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        closeEditModal();
        await load();
        toast.success("Location updated successfully!");
      } else {
        setEditMessage(j?.error ?? "Failed to update");
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
              <button onClick={() => openEditModal(l)} className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50">Edit</button>
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
    <Modal open={!!edit} onClose={closeEditModal} title="Edit location">
      <div className="grid gap-4">
        <div className="grid gap-1">
          <label className="text-sm font-medium">Name</label>
          <input
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Phone</label>
          <input
            value={editForm.phone}
            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
            className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Address</label>
          <input
            value={editForm.address}
            onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
            className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">City</label>
          <input
            value={editForm.city}
            onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
            className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={isPending}
            onClick={saveEdit}
            className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          {editMessage ? <p className="text-sm text-red-700">{editMessage}</p> : null}
        </div>
      </div>
    </Modal>
    </>
  );
}


