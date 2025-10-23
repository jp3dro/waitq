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
        <button type="button" className="action-btn action-btn--primary h-9 text-sm" onClick={() => setInvOpen(true)}>Invite user</button>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {grouped.map((m) => (
          <li key={m.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{m.user_id}</div>
              <div className="text-xs text-muted-foreground">{m.role}{ownerId && m.user_id === ownerId ? ' (owner)' : ''}</div>
            </div>
            <div>
              {m.role === 'admin' || (ownerId && m.user_id === ownerId) ? (
                <span className="text-xs text-muted-foreground">Cannot remove</span>
              ) : (
                <button className="action-btn text-sm h-8 px-2" onClick={() => removeMember(m.id, m.user_id, m.role)}>More actions ▾</button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={invOpen}
        onClose={() => setInvOpen(false)}
        title="Invite user"
        footer={
          <>
            <button type="button" className="action-btn" onClick={() => setInvOpen(false)}>Cancel</button>
            <button type="button" className="action-btn action-btn--primary" onClick={invite}>Invite</button>
          </>
        }
      >
        <div className="grid gap-3">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring px-3 py-2 text-sm" placeholder="user@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as any)} className="mt-1 block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring pl-3 pr-10 py-2 text-sm">
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}


