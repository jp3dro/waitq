"use client";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneInput, type Country } from "@/components/ui/phone-input";

type Customer = {
  key: string;
  name: string | null;
  phone: string | null;
  visits: number;
  firstSeen: string;
  lastSeen: string;
  servedCount: number;
  noShowCount?: number;
};

export default function CustomersTable({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"lastSeen" | "visits" | "served">("lastSeen");
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  useEffect(() => { setCustomers(initialCustomers); }, [initialCustomers]);

  const [isPending, setIsPending] = useState(false);
  const [editing, setEditing] = useState<{ open: boolean; key: string; name: string; phone: string } | null>(null);

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
    setEditing({ open: true, key: c.key, name: c.name || "", phone: c.phone || "" });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      setIsPending(true);
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: editing.key, name: editing.name || null, newPhone: editing.phone || null })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      await res.json().catch(() => ({}));
      setCustomers((prev) => prev.map((c) => (c.key === editing.key ? ({ ...c, name: editing.name || null, phone: editing.phone || null } as Customer) : c)));
      setEditing({ ...editing, open: false });
    } catch (err) {
      console.error("Failed to save customer", err);
      alert(`Save failed: ${(err as Error)?.message || String(err)}`);
    } finally {
      setIsPending(false);
    }
  };

  const onDelete = async (c: Customer) => {
    setIsPending(true);
    try {
      const res = await fetch(`/api/customers?key=${encodeURIComponent(c.key)}`, { method: "DELETE" });
      if (res.ok) {
        setCustomers((prev) => prev.filter((cc) => cc.key !== c.key));
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or phone..."
            className="w-full sm:w-80"
          />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort:</span>
            <div className="w-40">
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as typeof sortKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastSeen">Last seen</SelectItem>
                  <SelectItem value="visits">Visits</SelectItem>
                  <SelectItem value="served">Served</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              <th className="text-left font-medium text-foreground px-4 py-2">Name</th>
              <th className="text-left font-medium text-foreground px-4 py-2">Phone</th>
              <th className="text-left font-medium text-foreground px-4 py-2">Visits</th>
              <th className="text-left font-medium text-foreground px-4 py-2">Served</th>
              <th className="text-left font-medium text-foreground px-4 py-2">No show</th>
              <th className="text-left font-medium text-foreground px-4 py-2">First seen</th>
              <th className="text-left font-medium text-foreground px-4 py-2">Last seen</th>
              <th className="text-left font-medium text-foreground px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.key} className="border-t border-border hover:bg-muted odd:bg-muted/50">
                <td className="px-4 py-2">{c.name || "—"}</td>
                <td className="px-4 py-2">{c.phone || "—"}</td>
                <td className="px-4 py-2">{c.visits}</td>
                <td className="px-4 py-2">{c.servedCount}</td>
                <td className="px-4 py-2">{c.noShowCount ?? 0}</td>
                <td className="px-4 py-2">{new Date(c.firstSeen).toLocaleString()}</td>
                <td className="px-4 py-2">{new Date(c.lastSeen).toLocaleString()}</td>
                <td className="px-4 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Open menu">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onEdit(c)}>
                        <Pencil className="h-4 w-4" />
                        Edit details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => void onDelete(c)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete customer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={7}>No customers found</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing?.open} onOpenChange={(v) => (!v ? setEditing(null) : undefined)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={editing?.name || ""}
                onChange={(e) => setEditing((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Phone</Label>
              <PhoneInput
                defaultCountry={"PT" as Country}
                value={editing?.phone || ""}
                onChange={(value) => setEditing((prev) => (prev ? { ...prev, phone: value } : prev))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={saveEdit} disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


