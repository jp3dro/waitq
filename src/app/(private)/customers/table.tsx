"use client";
import { useMemo, useState } from "react";

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? initialCustomers.filter((c) =>
          (c.name || "").toLowerCase().includes(q) || (c.phone || "").toLowerCase().includes(q)
        )
      : initialCustomers;
    const sorted = [...list].sort((a, b) => {
      if (sortKey === "lastSeen") return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      if (sortKey === "visits") return b.visits - a.visits;
      return b.servedCount - a.servedCount;
    });
    return sorted;
  }, [initialCustomers, query, sortKey]);

  return (
    <div className="space-y-4">
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

      <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm">
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.key} className="border-t">
                  <td className="px-4 py-2">{c.name || "—"}</td>
                  <td className="px-4 py-2">{c.phone || "—"}</td>
                  <td className="px-4 py-2">{c.visits}</td>
                  <td className="px-4 py-2">{c.servedCount}</td>
                  <td className="px-4 py-2">{new Date(c.firstSeen).toLocaleString()}</td>
                  <td className="px-4 py-2">{new Date(c.lastSeen).toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-neutral-600" colSpan={6}>No customers found</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


