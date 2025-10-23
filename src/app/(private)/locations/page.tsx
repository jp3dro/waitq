"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import Modal from "@/components/modal";
import { toastManager } from "@/hooks/use-toast";

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
        toastManager.add({
          title: "Success",
          description: "Location updated successfully!",
          type: "success",
        });
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
        toastManager.add({
          title: "Success",
          description: "Location updated successfully!",
          type: "success",
        });
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
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          </div>
          <button onClick={() => setOpenCreate(true)} className="action-btn action-btn--primary">New location</button>
        </div>

        <div className="space-y-4">
          {msg ? <p className="text-sm text-destructive">{msg}</p> : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((l) => (
              <div key={l.id} className="bg-card text-card-foreground ring-1 ring-border rounded-xl shadow-sm p-5 hover:shadow hover:bg-muted transition">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium">{l.name}</h3>
                  </div>
                  {l.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <svg className="mr-2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      {l.phone}
                    </div>
                  )}
                  {l.address && (
                    <div className="flex items-start text-sm text-muted-foreground">
                      <svg className="mr-2 h-4 w-4 text-muted-foreground mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.458-7.5 11.458s-7.5-4.316-7.5-11.458a7.5 7.5 0 1115 0z" />
                      </svg>
                      <span>{l.address}</span>
                    </div>
                  )}
                  {l.city && (
                    <div className="flex items-center text-sm text-muted-foreground ml-6">
                      <span>{l.city}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
                  <button onClick={() => openEditModal(l)} className="action-btn text-xs transition-colors">
                    Edit
                  </button>
                  {canDelete && (
                    <button disabled={isPending} onClick={() => remove(l.id)} className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

    {/* Create Modal */}
    <Modal
      open={openCreate}
      onClose={() => setOpenCreate(false)}
      title="New location"
      footer={
        <>
          <button onClick={() => setOpenCreate(false)} className="action-btn">Cancel</button>
          <button onClick={create} disabled={isPending || !form.name.trim()} className="action-btn action-btn--primary disabled:opacity-50">Create</button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-1">
          <label className="text-sm font-medium">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Address</label>
          <input
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">City</label>
          <input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
          />
        </div>
      </div>
    </Modal>

    {/* Edit Modal */}
    <Modal
      open={!!edit}
      onClose={closeEditModal}
      title="Edit location"
      footer={
        <>
          <button onClick={closeEditModal} className="action-btn">Cancel</button>
          <button onClick={saveEdit} disabled={isPending} className="action-btn action-btn--primary disabled:opacity-50">Save changes</button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-1">
          <label className="text-sm font-medium">Name</label>
          <input
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Phone</label>
          <input
            value={editForm.phone}
            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
            className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Address</label>
          <input
            value={editForm.address}
            onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
            className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">City</label>
          <input
            value={editForm.city}
            onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
            className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm"
          />
        </div>
        {editMessage ? <p className="text-sm text-destructive">{editMessage}</p> : null}
      </div>
    </Modal>
      </div>
    </main>
  );
}


