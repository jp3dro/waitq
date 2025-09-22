"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/modal";
import Dropdown from "@/components/dropdown";
import toast from "react-hot-toast";

type Location = { id: string; name: string };

export default function EditListButton({
  waitlistId,
  initialName,
  initialLocationId,
  locations
}: {
  waitlistId: string;
  initialName: string;
  initialLocationId?: string;
  locations: Location[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [locationId, setLocationId] = useState(initialLocationId || locations[0]?.id || "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const openModal = () => {
    setOpen(true);
    setName(initialName);
    setLocationId(initialLocationId || locations[0]?.id || "");
    setMessage(null);
  };

  const closeModal = () => {
    setOpen(false);
    setName(initialName);
    setLocationId(initialLocationId || locations[0]?.id || "");
    setMessage(null);
  };

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const payload: { id: string; name?: string; locationId?: string } = { id: waitlistId };

      // Only include fields that have changed
      if (name !== initialName) {
        payload.name = name;
      }
      if (locationId !== (initialLocationId || locations[0]?.id || "")) {
        payload.locationId = locationId;
      }

      // If no fields changed, just close modal and show success
      if (Object.keys(payload).length === 1) {
        closeModal();
        toast.success("List updated successfully!");
        return;
      }

      const res = await fetch("/api/waitlists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        closeModal();
        router.refresh();
        toast.success("List updated successfully!");
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
      <button onClick={openModal} className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50">
        Edit
      </button>
      <Modal open={open} onClose={closeModal} title="Edit list">
        <div className="grid gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-md border-0 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-black px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Location</label>
            <Dropdown
              value={locationId}
              onChange={setLocationId}
              options={locations.map((l) => ({ value: l.id, label: l.name }))}
              disabled={isPending}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled={isPending}
              onClick={save}
              className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            {message ? <p className="text-sm text-red-700">{message}</p> : null}
          </div>
        </div>
      </Modal>
    </>
  );
}


