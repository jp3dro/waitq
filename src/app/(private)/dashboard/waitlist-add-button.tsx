"use client";
import { useState } from "react";
import Modal from "@/components/modal";
import AddForm from "./waitlist-add-form";
import { Plus } from "lucide-react";
import type { Country } from "react-phone-number-input";

export default function AddButton({ defaultWaitlistId, lockWaitlist, businessCountry }: { defaultWaitlistId?: string; lockWaitlist?: boolean; businessCountry?: Country }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90">
        <Plus className="h-4 w-4" />
        Add to waitlist
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add to waitlist">
        <AddForm onDone={() => setOpen(false)} defaultWaitlistId={defaultWaitlistId} lockWaitlist={lockWaitlist} businessCountry={businessCountry} />
      </Modal>
    </>
  );
}


