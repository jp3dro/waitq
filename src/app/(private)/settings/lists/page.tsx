"use client";
import { useEffect, useState, useTransition } from "react";

type W = { id: string; name: string; display_token?: string; location_id?: string | null; business_locations?: { id: string; name: string } | null };
type L = { id: string; name: string };

export default function ListsPage() {
  const [waitlists, setWaitlists] = useState<W[]>([]);
  const [newName, setNewName] = useState("");
  const [locations, setLocations] = useState<L[]>([]);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

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

  const createList = () => {
    startTransition(async () => {
      setMsg(null);
      const name = newName.trim();
      if (!name) return;
      const res = await fetch("/api/waitlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setNewName("");
        await load();
      } else {
        setMsg(j?.error ?? "Failed to create");
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
      } else {
        setMsg(j?.error ?? "Failed to delete");
      }
    });
  };

  const updateLocation = (id: string, locationId: string) => {
    startTransition(async () => {
      setMsg(null);
      const res = await fetch("/api/waitlists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, locationId }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        await load();
      } else {
        setMsg(j?.error ?? "Failed to update location");
      }
    });
  };

  return (
    <div className="bg-white ring-1 ring-black/5 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Lists</h2>
        <div className="flex items-center gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New list name" className="rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 px-2 py-1 text-sm" />
          <button disabled={isPending || !newName.trim()} onClick={createList} className="inline-flex items-center rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white shadow-sm disabled:opacity-50">Create</button>
        </div>
      </div>
      {msg ? <p className="mt-2 text-sm text-red-700">{msg}</p> : null}
      <ul className="mt-4 divide-y">
        {waitlists.map((w) => (
          <li key={w.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{w.name}</span>
              <select
                className="rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 px-2 py-1 text-xs"
                value={w.location_id || w.business_locations?.id || ""}
                onChange={(e) => updateLocation(w.id, e.target.value)}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              {w.display_token ? (
                <a
                  className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50"
                  href={`/display/${encodeURIComponent(w.display_token)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Display
                </a>
              ) : null}
            </div>
            {waitlists.length > 1 ? (
              <button disabled={isPending} onClick={() => remove(w.id)} className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50">Delete</button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}


