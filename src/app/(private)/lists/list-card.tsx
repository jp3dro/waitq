"use client";
import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ListCard({ id, name, waiting, etaDisplay }: { id: string; name: string; waiting: number; etaDisplay: string }) {
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
      <Link href={`/lists/${id}`} className="block bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-5 hover:shadow hover:bg-neutral-50 transition cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{name}</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-neutral-600">
              <span>Waiting: {waiting}</span>
              <span>ETA: {etaDisplay}</span>
            </div>
          </div>
        </div>
      </Link>
      <details className="absolute top-2 right-2">
        <summary className="list-none inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-neutral-300 bg-white hover:bg-neutral-50 cursor-pointer shadow-sm">⋯</summary>
        <div className="absolute right-0 mt-1 w-40 rounded-md border bg-white shadow-sm text-sm z-10">
          <button disabled={isPending} onClick={remove} className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 text-red-700">Delete</button>
        </div>
      </details>
    </div>
  );
}


