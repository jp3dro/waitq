"use client";
import Link from "next/link";
import { Monitor, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import ClearWaitlistButton from "../lists/[id]/clear-waitlist-button";

export default function ListCard({ id, name, waiting, etaDisplay, displayToken }: { id: string; name: string; waiting: number; etaDisplay: string; displayToken?: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const remove = () => {
    startTransition(async () => {
      const res = await fetch(`/api/waitlists?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    });
  };

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
      <details className="absolute top-2 right-2">
        <summary className="menu-trigger list-none">
          <MoreHorizontal className="h-4 w-4" />
        </summary>
        <div className="absolute right-0 mt-1 menu-container z-10">
          <a href={`/lists/${id}`} className="menu-item">
            <Pencil className="menu-icon" />
            <span>Edit</span>
          </a>
          <a href={`/display/${id}`} className="menu-item">
            <Monitor className="menu-icon" />
            <span>Open public display</span>
          </a>
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
    </div>
  );
}


