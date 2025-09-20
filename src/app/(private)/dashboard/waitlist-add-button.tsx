"use client";
import { useState } from "react";
import Modal from "@/components/modal";
import AddForm from "./waitlist-add-form";
import { Plus } from "lucide-react";

export default function AddButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800">
        <Plus className="h-4 w-4" />
        Add to waitlist
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add to waitlist">
        <AddForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}


