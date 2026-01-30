"use client";
import { useEffect, useMemo, useState } from "react";
import { Trash2, Pencil, RefreshCw } from "lucide-react";
import { toastManager } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import UpgradeRequiredDialog from "@/components/upgrade-required-dialog";
import type { PlanId } from "@/lib/plans";
import {
  Dialog,
  DialogContent,
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

type Member = {
  id: string;
  user_id: string | null;
  role: string;
  status?: string;
  email?: string;
  name?: string | null;
};

export default function UsersClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [invOpen, setInvOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [isPending, setIsPending] = useState(false);
  const [planId, setPlanId] = useState<PlanId>("free");
  const [userLimit, setUserLimit] = useState<number | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeTo, setUpgradeTo] = useState<PlanId>("base");
  const [inviteGateStatus, setInviteGateStatus] = useState<"loading" | "ready">("loading");

  // Editing state
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "staff">("staff");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const listRes = await fetch(`/api/memberships_list`, { cache: "no-store" }).catch(() => null);
      if (listRes && listRes.ok) {
        const j = await listRes.json();
        const list = j?.members || [];
        setMembers(list);
        setOwnerId(j?.ownerUserId || null);
      } else {
        setMembers([]);
        setOwnerId(null);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setInviteGateStatus("loading");
      try {
        const res = await fetch("/api/plan", { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        if (res.ok) {
          if (typeof j?.planId === "string") setPlanId(j.planId as PlanId);
          const lim = j?.limits?.users;
          if (typeof lim === "number") setUserLimit(lim);
          setInviteGateStatus(typeof lim === "number" ? "ready" : "loading");
        }
      } catch {
        setInviteGateStatus("ready");
      }
    })();
  }, []);

  const grouped = useMemo(() => members, [members]);
  const usedSeats = useMemo(() => {
    // memberships_list includes owner row in most setups; if not, we still enforce server-side.
    const activeLike = grouped.filter((m) => m.status === "active" || m.status === "pending");
    return activeLike.length;
  }, [grouped]);
  const atLimit = typeof userLimit === "number" && usedSeats >= userLimit;

  const openUpgrade = (next?: unknown) => {
    const n = next === "premium" ? "premium" : "base";
    setUpgradeTo(n as PlanId);
    setUpgradeOpen(true);
  };

  async function invite() {
    if (!email) return;
    setIsPending(true);
    const res = await fetch("/api/memberships", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, name })
    });
    setIsPending(false);

    if (res.ok) {
      const data = await res.json();
      setInvOpen(false);
      setEmail("");
      setName("");
      
      // Optimistic update or add from response
      if (data.membership) {
        setMembers((prev) => {
            // Check if we are updating an existing (expired) member
            const existingIndex = prev.findIndex(m => m.email === data.membership.email);
            if (existingIndex >= 0) {
                const copy = [...prev];
                copy[existingIndex] = {
                    ...copy[existingIndex],
                    id: data.membership.id,
                    role: data.membership.role,
                    status: data.membership.status,
                    name: data.membership.name || copy[existingIndex].name
                };
                return copy;
            }
            return [...prev, {
                id: data.membership.id,
                user_id: null,
                email: data.membership.email,
                role: data.membership.role,
                status: data.membership.status,
                name: data.membership.name || null
            }];
        });
      } else {
        // Fallback reload
        const listRes = await fetch(`/api/memberships_list`, { cache: "no-store" });
        if (listRes.ok) {
          const j = await listRes.json();
          setMembers(j.members || []);
        }
      }

      toastManager.add({
        title: "Success",
        description: "Invitation email sent successfully",
        type: "success"
      });
    } else {
      const j = await res.json().catch(() => ({}));
      if (res.status === 403 && (j?.upgradeTo === "base" || j?.upgradeTo === "premium")) {
        setInvOpen(false);
        openUpgrade(j.upgradeTo);
        return;
      }
      toastManager.add({
        title: "Error",
        description: j?.error || "Failed to invite user",
        type: "error"
      });
    }
  }

  async function resendInvite(email: string) {
    if (!email) return;
    const yes = confirm(`Resend invitation to ${email}?`);
    if (!yes) return;
    
    const res = await fetch("/api/memberships", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: 'staff' }) 
    });

    if (res.ok) {
      toastManager.add({ title: "Success", description: "Invitation resent", type: "success" });
      const listRes = await fetch(`/api/memberships_list`, { cache: "no-store" });
      if (listRes.ok) {
        const j = await listRes.json();
        setMembers(j.members || []);
      }
    } else {
      const j = await res.json().catch(() => ({}));
      if (res.status === 403 && (j?.upgradeTo === "base" || j?.upgradeTo === "premium")) {
        openUpgrade(j.upgradeTo);
        return;
      }
      toastManager.add({ title: "Error", description: j?.error || "Failed to resend", type: "error" });
    }
  }

  async function removeMember(id: string, userId: string | null, role: string) {
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

  function openEdit(member: Member) {
    setEditingMember(member);
    setEditName(member.name || "");
    // If role is admin, we can't edit role, but we can edit name (if implemented via profile update)
    // Assuming backend supports name update for members? 
    // The prompt says: "info is for the profile of the admin... we should be able to edit this information and give it a name"
    // This implies we need an endpoint to update user profile or membership metadata.
    // For now let's assume we just update local state or call an endpoint.
    // If it's the admin (owner), role is fixed.
    setEditRole(member.role === 'admin' ? 'staff' : (member.role as any)); 
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editingMember) return;
    setIsPending(true);

    // Determine if we are updating profile (for admin/owner) or membership (for others)
    // Actually, for Invited users, name might not be editable if it comes from THEIR profile.
    // BUT the prompt says: "the other users invited can also be edited by the admin."
    // Usually name is user-owned. But maybe we want to set a "display name" in membership?
    // Or we are updating the user's profile directly if we have permission?
    // Given the prompt "give it a name", let's assume we want to update the User's profile name.
    // We might need a new endpoint for this: PUT /api/memberships with name update?
    // Or PUT /api/profile for self?
    // The prompt says "Show the admin user... we show their data... edit this information... give it a name".
    // This implies updating the Admin's OWN profile name.
    
    // Let's implement a generic update that handles both cases if possible, or just calls the right endpoint.
    // Since we don't have a specific "update other user profile" endpoint yet, 
    // and typically you can't change another user's name in Auth, 
    // we might be storing name in a separate profile table or metadata.
    // However, the 'memberships_list' fetches name from `u.user?.user_metadata?.full_name`.
    // So we need to update `user_metadata`.
    // The admin can definitely update their OWN name.
    // Can they update OTHER users' names? Usually not. 
    // BUT, let's assume for now we only update name if it's the current user (Admin) OR if we add a backend capability.
    
    // Let's try to update via a new route or existing one.
    // For simplicity, I'll assume we create/use a route that can update member details.
    // I will create a PUT handler in /api/memberships to handle role updates, 
    // and maybe name updates if allowed.
    
    const payload: any = { membershipId: editingMember.id };
    if (editingMember.role !== 'admin') {
        payload.role = editRole;
    }
    // For name update, we'll send it too.
    payload.name = editName;

    const res = await fetch("/api/memberships", {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    setIsPending(false);
    if (res.ok) {
       setMembers(prev => prev.map(m => m.id === editingMember.id ? { ...m, role: editingMember.role === 'admin' ? 'admin' : editRole, name: editName } : m));
       setEditOpen(false);
       setEditingMember(null);
       toastManager.add({
        title: "Success",
        description: "User updated successfully",
        type: "success"
      });
    } else {
        const j = await res.json().catch(() => ({}));
        toastManager.add({
            title: "Error",
            description: j?.error || "Failed to update user",
            type: "error"
        });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Staff users</h1>
        <Button
          type="button"
          onClick={() => {
            if (inviteGateStatus !== "ready") return;
            if (atLimit) {
              openUpgrade(planId === "base" ? "premium" : "base");
              return;
            }
            setInvOpen(true);
          }}
          disabled={inviteGateStatus !== "ready"}
          title={
            inviteGateStatus !== "ready"
              ? "Loading plan limits…"
              : atLimit
                ? "User limit reached for your plan"
                : undefined
          }
        >
          Invite user
        </Button>
      </div>

      <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="text-left font-medium text-foreground px-4 py-2">Name</th>
                <th className="text-left font-medium text-foreground px-4 py-2">Email</th>
                <th className="text-left font-medium text-foreground px-4 py-2">Role</th>
                <th className="text-left font-medium text-foreground px-4 py-2">Status</th>
                <th className="text-right font-medium text-foreground px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr>
                   <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                 </tr>
              ) : grouped.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found.</td>
                 </tr>
              ) : (
                grouped.map((m) => (
                  <tr key={m.id} className="border-t border-border hover:bg-muted odd:bg-muted/50">
                    <td className="px-4 py-2 font-medium">{m.name || "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.email || m.user_id || "Unknown"}</td>
                    <td className="px-4 py-2 capitalize">{(ownerId && m.user_id === ownerId) ? 'Owner' : m.role === 'admin' ? 'Admin' : m.role}</td>
                    <td className="px-4 py-2">
                      {m.status === 'pending' ? (
                        <span className="inline-flex items-center rounded-md bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-500 ring-1 ring-inset ring-yellow-600/20 dark:ring-yellow-500/30">Pending</span>
                      ) : m.status === 'expired' ? (
                        <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/30 px-2 py-1 text-xs font-medium text-red-800 dark:text-red-500 ring-1 ring-inset ring-red-600/20 dark:ring-red-500/30">Expired</span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20 dark:ring-green-500/30">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {m.status === 'expired' && m.email && (
                            <button 
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                            onClick={() => resendInvite(m.email!)}
                            title="Resend invite"
                            >
                            <RefreshCw className="h-4 w-4" />
                            </button>
                        )}
                         <button 
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                          onClick={() => openEdit(m)}
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {m.role === 'admin' || (ownerId && m.user_id === ownerId) ? (
                            <span className="w-8"></span> 
                        ) : (
                            <button 
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                            onClick={() => removeMember(m.id, m.user_id, m.role)}
                            title="Remove user"
                            >
                            <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      <Dialog open={invOpen} onOpenChange={setInvOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <div className="flex max-h-[90vh] flex-col">
            <div className="min-h-12 h-12 shrink-0 border-b border-border px-6 flex items-center">
              <DialogHeader>
                <DialogTitle className="truncate">Invite user</DialogTitle>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 min-h-12 h-12 shrink-0 border-t border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center">
              <div className="ml-auto flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setInvOpen(false)}>Cancel</Button>
                <Button type="button" disabled={isPending} onClick={invite}>
                  {isPending ? "Sending..." : "Invite"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

       {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <div className="flex max-h-[90vh] flex-col">
            <div className="min-h-12 h-12 shrink-0 border-b border-border px-6 flex items-center">
              <DialogHeader>
                <DialogTitle className="truncate">Edit user</DialogTitle>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editingMember?.email || editingMember?.user_id || ""}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">E-mail addresses can't be modified.</p>
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  {(ownerId && editingMember?.user_id === ownerId) ? (
                    <>
                      <div className="text-sm text-muted-foreground rounded-md border border-border bg-muted/50 px-3 py-2">
                        Owner
                      </div>
                      <p className="text-xs text-muted-foreground">Owner role cannot be changed.</p>
                    </>
                  ) : (
                    <Select value={editRole} onValueChange={(v) => setEditRole(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 min-h-12 h-12 shrink-0 border-t border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center">
              <div className="ml-auto flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="button" disabled={isPending} onClick={saveEdit}>
                  {isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeRequiredDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        title={upgradeTo === "premium" ? "Upgrade to add more staff users" : "Upgrade to invite more staff users"}
        description={
          upgradeTo === "premium"
            ? "Your current plan has reached its user limit. Upgrade to Premium to add more staff users."
            : "Your current plan has reached its user limit. Upgrade to Base to add more staff users."
        }
        ctaLabel={upgradeTo === "premium" ? "Upgrade to Premium" : "Upgrade to Base"}
        ctaHref="/subscriptions"
      />
    </div>
  );
}
