"use client";
import Link from "next/link";
import { Monitor, Pencil, Trash2, MoreHorizontal, QrCode } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ClearWaitlistButton from "../lists/[id]/clear-waitlist-button";
import QRCodeModal from "./qr-code-modal";
import EditListButton from "./[id]/edit-list-button";
import { toastManager } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ListCard({
  id,
  name,
  waiting,
  etaDisplay,
  displayToken,
  businessName,
  initialLocationId,
  kioskEnabled,
  displayEnabled,
  displayShowName,
  displayShowQr,
  locationIsOpen,
  locations,
  disableDelete,
}: {
  id: string;
  name: string;
  waiting: number;
  etaDisplay: string;
  displayToken?: string | null;
  businessName?: string;
  initialLocationId?: string | null;
  kioskEnabled?: boolean | null;
  displayEnabled?: boolean | null;
  displayShowName?: boolean | null;
  displayShowQr?: boolean | null;
  locationIsOpen?: boolean;
  locations?: { id: string; name: string }[];
  disableDelete?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [qrOpen, setQrOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const remove = () => {
    if (disableDelete) return;
    startTransition(async () => {
      const res = await fetch(`/api/waitlists?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        toastManager.add({ title: "List deleted", description: `${name} was removed.`, type: "success" });
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        toastManager.add({ title: "Failed to delete", description: json.error || "Please try again.", type: "error" });
      }
    });
  };

  // Close actions menu on outside click and Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // DropdownMenu handles escape itself; keep for any custom listeners we add later.
      void e;
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Listen for a page-level request to open edit directly
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id?: string } | undefined;
      if (detail?.id === id) {
        setEditOpen(true);
      }
    };
    window.addEventListener('wl:open-edit', handler as EventListener);
    return () => window.removeEventListener('wl:open-edit', handler as EventListener);
  }, [id]);

  const isClosed = locationIsOpen === false;
  const isLive = !!kioskEnabled && !isClosed;

  return (
    <div className="relative">
      <Link href={`/lists/${id}`} className="block bg-card text-card-foreground ring-1 ring-border rounded-xl shadow-sm p-5 hover:shadow hover:bg-muted transition cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{name}</p>
              {isClosed ? (
                <Badge variant="secondary" className="gap-1 text-xs bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/30">
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive"></span>
                  Closed
                </Badge>
              ) : isLive ? (
                <Badge variant="secondary" className="gap-1 text-xs bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-800">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  Live
                </Badge>
              ) : null}
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span>Waiting: {waiting}</span>
              <span>ETA: {etaDisplay}</span>
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {displayEnabled !== false && displayToken ? (
              <>
                <DropdownMenuItem asChild>
                  <a
                    href={`/display/${encodeURIComponent(displayToken)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Monitor className="h-4 w-4" />
                    Open public display
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setQrOpen(true)}>
                  <QrCode className="h-4 w-4" />
                  Open QR code
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <ClearWaitlistButton waitlistId={id} displayToken={displayToken} variant="menu" />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isPending || disableDelete}
              onSelect={() => {
                if (!disableDelete) remove();
              }}
              className="text-destructive focus:text-destructive"
              title={disableDelete ? "You must have at least one list" : "Delete list"}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {displayEnabled !== false && displayToken ? (
        <QRCodeModal open={qrOpen} onClose={() => setQrOpen(false)} listName={name} displayToken={displayToken || undefined} businessName={businessName} />
      ) : null}
      <EditListButton
        waitlistId={id}
        initialName={name}
        initialLocationId={initialLocationId || undefined}
        initialKioskEnabled={!!kioskEnabled}
        initialDisplayEnabled={displayEnabled !== false}
        initialDisplayShowName={displayShowName !== false}
        initialDisplayShowQr={displayShowQr === true}
        locations={locations || []}
        controlledOpen={editOpen}
        onOpenChange={setEditOpen}
        hideTrigger
      />
    </div>
  );
}

