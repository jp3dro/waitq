"use client";

import { useRef, useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toastManager } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogBody,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ProfileData = {
    name: string;
    email: string;
    avatarUrl: string | null;
};

type Props = {
    initial: ProfileData;
};

export default function ProfileClient({ initial }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const avatarFileRef = useRef<HTMLInputElement | null>(null);

    const [baseline, setBaseline] = useState({ name: initial.name });
    const [name, setName] = useState(initial.name);
    const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);

    const dirty = useMemo(() => {
        return name.trim() !== baseline.name.trim();
    }, [name, baseline.name]);

    const initials = useMemo(() => {
        const raw = name?.trim() || "";
        if (raw) {
            const parts = raw.split(/\s+/);
            if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
            return raw.slice(0, 2).toUpperCase();
        }
        const emailPart = initial.email?.split("@")[0] || "";
        return emailPart.slice(0, 2).toUpperCase() || "??";
    }, [name, initial.email]);

    async function uploadAvatar(file: File) {
        if (file.size > 5 * 1024 * 1024) {
            toastManager.add({ title: "Upload failed", description: "File too large (max 5MB).", type: "error" });
            return;
        }
        if (!file.type.startsWith("image/")) {
            toastManager.add({ title: "Upload failed", description: "File must be an image.", type: "error" });
            return;
        }

        const fd = new FormData();
        fd.append("file", file);
        setUploading(true);
        try {
            const res = await fetch("/api/user-profile/avatar", { method: "POST", body: fd });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(j?.error || "Upload failed");

            const url = typeof j?.url === "string" ? j.url : null;
            if (!url) throw new Error("Upload failed");

            setAvatarUrl(url);
            router.refresh();
            toastManager.add({ title: "Uploaded", description: "Profile picture updated.", type: "success" });
        } catch (e) {
            toastManager.add({ title: "Upload failed", description: (e as Error).message, type: "error" });
        } finally {
            setUploading(false);
        }
    }

    async function removeAvatar() {
        setUploading(true);
        try {
            const res = await fetch("/api/user-profile/avatar", { method: "DELETE" });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(j?.error || "Failed to remove picture");

            setAvatarUrl(null);
            router.refresh();
            toastManager.add({ title: "Removed", description: "Profile picture removed.", type: "success" });
        } catch (e) {
            toastManager.add({ title: "Error", description: (e as Error).message, type: "error" });
        } finally {
            setUploading(false);
        }
    }

    async function save() {
        startTransition(async () => {
            const payload: Record<string, unknown> = {};
            const n = name.trim();
            if (n !== baseline.name) payload.name = n;

            if (Object.keys(payload).length === 0) {
                toastManager.add({ title: "No changes", description: "Nothing to save.", type: "info" });
                return;
            }

            const res = await fetch("/api/user-profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const j = await res.json().catch(() => ({}));
            if (res.ok) {
                toastManager.add({ title: "Saved", description: "Profile updated.", type: "success" });
                setBaseline({ name: n });
                router.refresh();
            } else {
                const err = typeof j?.error === "string" ? j.error : "Failed to save changes";
                toastManager.add({ title: "Error", description: err, type: "error" });
            }
        });
    }

    async function handleDeleteAccount() {
        setDeleting(true);
        try {
            const res = await fetch("/api/account/delete", { method: "POST" });
            const j = (await res.json().catch(() => ({}))) as { error?: string };
            if (!res.ok) throw new Error(j.error || "Failed to delete account");
            window.location.href = "/auth/logout";
        } catch (e) {
            console.error(e);
            toastManager.add({
                title: "Error",
                description: e instanceof Error ? e.message : "Failed to delete account",
                type: "error",
            });
            setDeleting(false);
        }
    }

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Avatar Section */}
            <div className="space-y-4">
                <div className="text-sm font-medium">Profile picture</div>
                <div className="grid items-start gap-4 md:grid-cols-[96px_1fr]">
                    <div className="h-24 w-24 rounded-full ring-1 ring-border overflow-hidden bg-muted flex items-center justify-center">
                        {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-xl font-semibold text-muted-foreground">{initials}</span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            ref={avatarFileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void uploadAvatar(f);
                                if (avatarFileRef.current) avatarFileRef.current.value = "";
                            }}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => avatarFileRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? "Uploading..." : "Upload picture"}
                        </Button>
                        {avatarUrl ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => void removeAvatar()}
                                disabled={uploading}
                            >
                                Remove
                            </Button>
                        ) : null}
                        <div className="text-xs text-muted-foreground">PNG/JPG, square recommended. Max 5 MB.</div>
                    </div>
                </div>
            </div>

            {/* Name Section */}
            <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Name</label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                />
                <p className="text-sm text-muted-foreground">
                    This is how your name appears across WaitQ.
                </p>
            </div>

            {/* Email Section */}
            <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Email</label>
                <Input value={initial.email} disabled className="bg-muted" />
                <p className="text-sm text-muted-foreground">
                    Your email address cannot be changed.
                </p>
            </div>

            {/* Save Button */}
            <div className="pt-2">
                <Button onClick={save} disabled={isPending || uploading || !dirty}>
                    {isPending ? "Saving..." : "Save changes"}
                </Button>
            </div>

            {/* Danger Zone */}
            <div className="pt-8">
                <div className="rounded-lg border border-destructive/50 p-6 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-destructive">Danger zone</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Irreversible and destructive actions
                        </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2">
                        <div>
                            <div className="font-medium">Delete account</div>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete your account and all associated data.
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Delete account</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogBody>
                                    <AlertDialogDescription>
                                        This will permanently delete your user, business setup data, and activity from the
                                        database. This cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogBody>
                                <AlertDialogFooter>
                                    <AlertDialogAction
                                        variant="destructive"
                                        disabled={deleting}
                                        onClick={handleDeleteAccount}
                                    >
                                        {deleting ? "Deleting…" : "Delete"}
                                    </AlertDialogAction>
                                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </div>
        </div>
    );
}
