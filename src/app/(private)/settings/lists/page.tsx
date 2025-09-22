"use client";
import { useEffect, useState, useTransition } from "react";
import Modal from "@/components/modal";
import Dropdown from "@/components/dropdown";
import toast from "react-hot-toast";

type W = { id: string; name: string; display_token?: string; location_id?: string | null; business_locations?: { id: string; name: string } | null };
type L = { id: string; name: string };

export default function ListsPage() {
  const [waitlists, setWaitlists] = useState<W[]>([]);
  const [locations, setLocations] = useState<L[]>([]);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [editingWaitlist, setEditingWaitlist] = useState<W | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocationId, setEditLocationId] = useState("");
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/waitlists", { cache: "no-store" });
    const j = await res.json();
    setWaitlists(j.waitlists || []);
  }
  async function loadLocations() {
    const res = await fetch("/api/locations", { cache: "no-store" });
    const j = await res.json();
    setLocations(j.locations || []);
  }

  useEffect(() => {
    load();
    loadLocations();
  }, []);

  const openCreateModal = () => {
    setIsCreating(true);
    setCreateName("");
    setCreateMessage(null);
  };

  const closeCreateModal = () => {
    setIsCreating(false);
    setCreateName("");
    setCreateMessage(null);
  };

  const createList = () => {
    setCreateMessage(null);
    startTransition(async () => {
      const name = createName.trim();
      if (!name) return;
      const res = await fetch("/api/waitlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        closeCreateModal();
        await load();
        toast.success("List created successfully!");
      } else {
        setCreateMessage(j?.error ?? "Failed to create");
      }
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      setMsg(null);
      if (waitlists.length <= 1) return;
      const res = await fetch(`/api/waitlists?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        await load();
        toast.success("List deleted successfully!");
      } else {
        setMsg(j?.error ?? "Failed to delete");
      }
    });
  };


  const openEditModal = (waitlist: W) => {
    setEditingWaitlist(waitlist);
    setEditName(waitlist.name);
    setEditLocationId(waitlist.location_id || waitlist.business_locations?.id || locations[0]?.id || "");
    setEditMessage(null);
  };

  const closeEditModal = () => {
    setEditingWaitlist(null);
    setEditName("");
    setEditLocationId(locations[0]?.id || "");
    setEditMessage(null);
  };

  const saveEdit = () => {
    if (!editingWaitlist) return;
    setEditMessage(null);
    startTransition(async () => {
      const payload: { id: string; name?: string; locationId?: string } = { id: editingWaitlist.id };

      // Only include fields that have changed
      if (editName !== editingWaitlist.name) {
        payload.name = editName;
      }
      if (editLocationId !== (editingWaitlist.location_id || editingWaitlist.business_locations?.id || locations[0]?.id || "")) {
        payload.locationId = editLocationId;
      }

      // If no fields changed, just close modal and show success
      if (Object.keys(payload).length === 1) {
        closeEditModal();
        toast.success("List updated successfully!");
        return;
      }

      const res = await fetch("/api/waitlists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        closeEditModal();
        await load();
        toast.success("List updated successfully!");
      } else {
        try {
          const j = await res.json();
          const err = (j && j.error) || "Failed to save";
          setEditMessage(typeof err === "string" ? err : "Failed to save");
        } catch {
          setEditMessage("Failed to save");
        }
      }
    });
  };

  return (
    <div className="bg-white ring-1 ring-black/5 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Lists</h2>
        <button onClick={openCreateModal} className="inline-flex items-center rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-neutral-800">Create list</button>
      </div>
      {msg ? <p className="mt-2 text-sm text-red-700">{msg}</p> : null}
      <ul className="mt-4 divide-y">
        {waitlists.map((w) => (
          <li key={w.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{w.name}</span>
              <span className="text-xs text-neutral-500">•</span>
              <span className="text-xs text-neutral-600">{w.business_locations?.name || "No location"}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEditModal(w)} className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50">Edit</button>
              {waitlists.length > 1 ? (
                <button disabled={isPending} onClick={() => remove(w.id)} className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50">Delete</button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <Modal open={isCreating} onClose={closeCreateModal} title="Create list">
        <div className="grid gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Name</label>
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-3 py-2 text-sm"
              placeholder="Enter list name"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled={isPending}
              onClick={createList}
              className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create"}
            </button>
            {createMessage ? <p className="text-sm text-red-700">{createMessage}</p> : null}
          </div>
        </div>
      </Modal>
      <Modal open={!!editingWaitlist} onClose={closeEditModal} title="Edit list">
        <div className="grid gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Name</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Location</label>
            <Dropdown
              value={editLocationId}
              onChange={setEditLocationId}
              options={locations.map((l) => ({ value: l.id, label: l.name }))}
              disabled={isPending}
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
    </div>
  );
}


