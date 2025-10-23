"use client";
import Link from "next/link";
import { Monitor, Pencil, Trash2, MoreHorizontal, QrCode } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ClearWaitlistButton from "../lists/[id]/clear-waitlist-button";
import QRCodeModal from "./qr-code-modal";
import EditListButton from "./[id]/edit-list-button";
import { toastManager } from "@/hooks/use-toast";

export default function ListCard({ id, name, waiting, etaDisplay, displayToken, businessName, initialLocationId, kioskEnabled, locations }: { id: string; name: string; waiting: number; etaDisplay: string; displayToken?: string | null; businessName?: string; initialLocationId?: string | null; kioskEnabled?: boolean | null; locations?: { id: string; name: string }[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [qrOpen, setQrOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  const remove = () => {
    startTransition(async () => {
      const res = await fetch(`/api/waitlists?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        toastManager.add({ title: "List deleted", description: `${name} was removed.`, type: "success" });
        router.refresh();
      } else {
        toastManager.add({ title: "Failed to delete", description: "Please try again.", type: "error" });
      }
    });
  };

  // Close actions menu on outside click and Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const d = detailsRef.current;
      if (!d) return;
      const target = e.target as Node | null;
      if (d.open && target && !d.contains(target)) {
        d.open = false;
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const d = detailsRef.current;
      if (!d) return;
      if (d.open && e.key === 'Escape') d.open = false;
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Listen for a page-level request to open edit directly
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id?: string } | undefined;
      if (detail?.id === id) {
        const el = document.getElementById(`edit-list-inline-${id}`);
        if (el) (el as HTMLButtonElement).click();
      }
    };
    window.addEventListener('wl:open-edit', handler as EventListener);
    return () => window.removeEventListener('wl:open-edit', handler as EventListener);
  }, [id]);

  return (
    <div className="relative">
      <Link href={`/lists/${id}`} className="block bg-card text-card-foreground ring-1 ring-border rounded-xl shadow-sm p-5 hover:shadow hover:bg-muted transition cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{name}</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span>Waiting: {waiting}</span>
              <span>ETA: {etaDisplay}</span>
            </div>
          </div>
        </div>
      </Link>
      <details className="absolute top-2 right-2" ref={detailsRef}>
        <summary className="menu-trigger list-none">
          <MoreHorizontal className="h-4 w-4" />
        </summary>
        <div className="absolute right-0 mt-1 menu-container z-10">
          <button onClick={() => {
            const el = document.getElementById(`edit-list-inline-${id}`);
            if (el) (el as HTMLButtonElement).click();
            if (detailsRef.current) detailsRef.current.open = false;
          }} className="menu-item">
            <Pencil className="menu-icon" />
            <span>Edit</span>
          </button>
          <a href={displayToken ? `/display/${encodeURIComponent(displayToken)}` : `/lists/${id}`} className="menu-item">
            <Monitor className="menu-icon" />
            <span>Open public display</span>
          </a>
          <button onClick={() => setQrOpen(true)} className="menu-item">
            <QrCode className="menu-icon" />
            <span>Open QR code</span>
          </button>
          <div className="menu-separator"></div>
          <ClearWaitlistButton waitlistId={id} displayToken={displayToken} variant="menu" />
          <button
            disabled={isPending}
            onClick={remove}
            className="menu-item menu-item--danger"
          >
            <Trash2 className="menu-icon" />
            <span>Delete</span>
          </button>
        </div>
      </details>
      <QRCodeModal open={qrOpen} onClose={() => setQrOpen(false)} listName={name} displayToken={displayToken || undefined} businessName={businessName} />
      {/* Hidden edit modal to be triggered from menu */}
      <EditListTrigger
        id={id}
        name={name}
        initialLocationId={initialLocationId || undefined}
        kioskEnabled={!!kioskEnabled}
        locations={locations || []}
      />
    </div>
  );
}

function EditListTrigger({ id, name, initialLocationId, kioskEnabled, locations }: { id: string; name: string; initialLocationId?: string; kioskEnabled?: boolean; locations: { id: string; name: string }[] }) {
  return (
    <div className="sr-only" aria-hidden>
      <EditListButton
        waitlistId={id}
        initialName={name}
        initialLocationId={initialLocationId}
        initialKioskEnabled={!!kioskEnabled}
        locations={locations}
        triggerId={`edit-list-inline-${id}`}
        hideTrigger
      />
    </div>
  );
}


