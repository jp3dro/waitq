"use client";
import { useState, useTransition } from "react";
import Modal from "@/components/modal";

export default function EditListButton({ waitlistId, initialName }: { waitlistId: string; initialName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/waitlists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: waitlistId, name }),
      });
      if (res.ok) {
        setOpen(false);
        try {
          const { useRouter } = await import("next/navigation");
          const r = useRouter();
          r.refresh();
        } catch {}
      } else {
        try {
          const j = await res.json();
          const err = (j && j.error) || "Failed to save";
          setMessage(typeof err === "string" ? err : "Failed to save");
        } catch {
          setMessage("Failed to save");
        }
      }
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50">
        Edit
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit list">
        <div className="grid gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <button disabled={isPending} onClick={save} className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50">
              {isPending ? "Saving…" : "Save"}
            </button>
            {message ? <p className="text-sm text-red-700">{message}</p> : null}
          </div>
        </div>
      </Modal>
    </>
  );
}


