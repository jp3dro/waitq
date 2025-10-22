"use client";
import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/modal";

export default function UsersClient() {
  const [members, setMembers] = useState<Array<{ id: string; user_id: string; role: string }>>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [invOpen, setInvOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "staff">("staff");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const listRes = await fetch(`/api/memberships_list`, { cache: "no-store" }).catch(() => null);
      if (listRes && listRes.ok) {
        const j = await listRes.json();
        const list = (j?.members as Array<{ id: string; user_id: string; role: string }>) || [];
        setMembers(list);
        setOwnerId(j?.ownerUserId || null);
      } else {
        setMembers([]);
        setOwnerId(null);
      }
      setLoading(false);
    })();
  }, []);

  const grouped = useMemo(() => members, [members]);

  async function invite() {
    if (!email) return;
    const res = await fetch("/api/memberships", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    });
    if (res.ok) {
      setInvOpen(false);
      setEmail("");
      // reload list
      const listRes = await fetch(`/api/memberships_list`, { cache: "no-store" });
      if (listRes.ok) setMembers(await listRes.json());
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || "Failed to invite user");
    }
  }

  async function removeMember(id: string, userId: string, role: string) {
    if (role === 'admin' || (ownerId && userId === ownerId)) return; // cannot remove admin/owner
    const yes = confirm("Remove this user from the business?");
    if (!yes) return;
    const res = await fetch("/api/memberships", { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ membershipId: id }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(j?.error || "Failed to remove");
      return;
    }
    setMembers((cur) => cur.filter((m) => m.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <button type="button" className="h-9 rounded-md bg-black text-white text-sm px-3" onClick={() => setInvOpen(true)}>Invite user</button>
      </div>
      <ul className="mt-3 divide-y divide-neutral-200">
        {grouped.map((m) => (
          <li key={m.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{m.user_id}</div>
              <div className="text-xs text-neutral-600">{m.role}{ownerId && m.user_id === ownerId ? ' (owner)' : ''}</div>
            </div>
            <div>
              {m.role === 'admin' || (ownerId && m.user_id === ownerId) ? (
                <span className="text-xs text-neutral-500">Cannot remove</span>
              ) : (
                <button className="text-sm px-2 h-8 rounded-md border border-neutral-200" onClick={() => removeMember(m.id, m.user_id, m.role)}>More actions ▾</button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Modal open={invOpen} onClose={() => setInvOpen(false)} title="Invite user">
        <div className="grid gap-3">
          <div>
            <label className="text-sm">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-9 rounded-md border border-neutral-200 px-3 text-sm w-full" placeholder="user@example.com" />
          </div>
          <div>
            <label className="text-sm">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as any)} className="mt-1 h-9 rounded-md border border-neutral-200 px-2 text-sm w-full">
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" className="h-9 rounded-md border border-neutral-200 text-sm px-3" onClick={() => setInvOpen(false)}>Cancel</button>
            <button type="button" className="h-9 rounded-md bg-black text-white text-sm px-3" onClick={invite}>Invite</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


