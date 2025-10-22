"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "@/components/modal";

type Customer = {
  key: string;
  name: string | null;
  phone: string | null;
  visits: number;
  firstSeen: string;
  lastSeen: string;
  servedCount: number;
};

export default function CustomersTable({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"lastSeen" | "visits" | "served">("lastSeen");
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  useEffect(() => { setCustomers(initialCustomers); }, [initialCustomers]);

  const [menuState, setMenuState] = useState<{ key: string; phoneKey: string; top: number; left: number } | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [editing, setEditing] = useState<{ open: boolean; phoneKey: string; name: string; phone: string } | null>(null);

  const openMenu = (customer: Customer, trigger: HTMLElement) => {
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 192;
    const estHeight = 140;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = rect.left;
    let top = rect.bottom + 4;
    if (left + menuWidth > vw - 8) left = Math.max(8, rect.right - menuWidth);
    if (top + estHeight > vh - 8 && rect.top - estHeight > 8) top = Math.max(8, rect.top - estHeight - 4);
    const phoneKey = (customer.phone || "").replace(/\D+/g, "");
    if (!phoneKey) return;
    setMenuState({ key: customer.key, phoneKey, top, left });
  };
  const closeMenu = () => setMenuState(null);

  useEffect(() => {
    if (!menuState) return;
    const onClose = () => setMenuState(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuState(null); };
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuState]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? customers.filter((c) =>
          (c.name || "").toLowerCase().includes(q) || (c.phone || "").toLowerCase().includes(q)
        )
      : customers;
    const sorted = [...list].sort((a, b) => {
      if (sortKey === "lastSeen") return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      if (sortKey === "visits") return b.visits - a.visits;
      return b.servedCount - a.servedCount;
    });
    return sorted;
  }, [customers, query, sortKey]);

  const onEdit = (c: Customer) => {
    const phoneKey = (c.phone || "").replace(/\D+/g, "");
    if (!phoneKey) return;
    setEditing({ open: true, phoneKey, name: c.name || "", phone: c.phone || "" });
    closeMenu();
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      setIsPending(true);
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneKey: editing.phoneKey, name: editing.name || null, newPhone: editing.phone || null })
      });
      if (res.ok) {
        setCustomers((prev) => prev.map((c) => {
          const pk = (c.phone || "").replace(/\D+/g, "");
          if (pk === editing.phoneKey) {
            return { ...c, name: editing.name || null, phone: editing.phone || null } as Customer;
          }
          return c;
        }));
        setEditing(null);
      }
    } finally {
      setIsPending(false);
    }
  };

  const onDelete = async (c: Customer) => {
    const phoneKey = (c.phone || "").replace(/\D+/g, "");
    if (!phoneKey) return;
    closeMenu();
    setIsPending(true);
    try {
      const res = await fetch(`/api/customers?phoneKey=${encodeURIComponent(phoneKey)}`, { method: "DELETE" });
      if (res.ok) {
        setCustomers((prev) => prev.filter((cc) => (cc.phone || "").replace(/\D+/g, "") !== phoneKey));
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-white ring-1 ring-black/5 rounded-xl">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or phone..."
            className="w-full sm:w-80 rounded-md border px-3 py-2 text-sm ring-1 ring-inset ring-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-800"
          />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-600">Sort:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as "lastSeen" | "visits" | "served")}
              className="rounded-md border px-2 py-1.5 ring-1 ring-inset ring-neutral-300"
            >
              <option value="lastSeen">Last seen</option>
              <option value="visits">Visits</option>
              <option value="served">Served</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 sticky top-0 z-10">
              <tr>
                <th className="text-left font-medium text-neutral-700 px-4 py-2">Name</th>
                <th className="text-left font-medium text-neutral-700 px-4 py-2">Phone</th>
                <th className="text-left font-medium text-neutral-700 px-4 py-2">Visits</th>
                <th className="text-left font-medium text-neutral-700 px-4 py-2">Served</th>
                <th className="text-left font-medium text-neutral-700 px-4 py-2">First seen</th>
                <th className="text-left font-medium text-neutral-700 px-4 py-2">Last seen</th>
                <th className="text-left font-medium text-neutral-700 px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.key} className="border-t hover:bg-neutral-50 odd:bg-neutral-50/30">
                  <td className="px-4 py-2">{c.name || "—"}</td>
                  <td className="px-4 py-2">{c.phone || "—"}</td>
                  <td className="px-4 py-2">{c.visits}</td>
                  <td className="px-4 py-2">{c.servedCount}</td>
                  <td className="px-4 py-2">{new Date(c.firstSeen).toLocaleString()}</td>
                  <td className="px-4 py-2">{new Date(c.lastSeen).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">
                    {(c.phone || "").replace(/\D+/g, "") ? (
                      <button
                        onClick={(ev) => openMenu(c, ev.currentTarget as HTMLElement)}
                        className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-neutral-300 bg-white hover:bg-neutral-50 shadow-sm"
                      >
                        ⋯
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-neutral-600" colSpan={7}>No customers found</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {menuState && (() => {
          const me = customers.find(cc => cc.key === menuState.key);
          if (!me) return null;
          return createPortal(
            <div className="fixed inset-0 z-50" onClick={closeMenu}>
              <div
                className="absolute w-48 rounded-md bg-white text-sm shadow-lg ring-1 ring-black/5 py-1"
                style={{ top: menuState.top, left: menuState.left }}
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => onEdit(me)} className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-blue-700 flex items-center gap-2">
                  <span>✏️</span> Edit details
                </button>
                <div className="border-t my-1"></div>
                <button onClick={() => onDelete(me)} className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-red-700">Delete customer</button>
              </div>
            </div>,
            document.body
          );
        })()}
      </div>
      <Modal open={!!editing?.open} onClose={() => setEditing(null)} title="Edit customer">
        <div className="grid gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Name</label>
            <input
              value={editing?.name || ""}
              onChange={(e) => setEditing((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
              className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-[#FF9500] px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Phone</label>
            <input
              value={editing?.phone || ""}
              onChange={(e) => setEditing((prev) => (prev ? { ...prev, phone: e.target.value } : prev))}
              className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-[#FF9500] px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={saveEdit}
              disabled={isPending}
              className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="inline-flex items-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


