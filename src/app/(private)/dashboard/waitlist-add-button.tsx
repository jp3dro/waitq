"use client";
import { useState } from "react";
import Modal from "@/components/modal";
import AddForm from "./waitlist-add-form";
import { Plus } from "lucide-react";
import type { Country } from "react-phone-number-input";

export default function AddButton({ defaultWaitlistId, lockWaitlist, businessCountry }: { defaultWaitlistId?: string; lockWaitlist?: boolean; businessCountry?: Country }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="action-btn action-btn--primary gap-2 text-sm">
        <Plus className="h-4 w-4" />
        Add to waitlist
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add to waitlist"
        footer={
          <>
            <button type="button" className="action-btn" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="add-waitlist-form" disabled={pending} className="action-btn action-btn--primary disabled:opacity-50">{pending ? "Adding…" : "Add"}</button>
          </>
        }
      >
        <AddForm onDone={() => setOpen(false)} defaultWaitlistId={defaultWaitlistId} lockWaitlist={lockWaitlist} businessCountry={businessCountry} onPendingChange={setPending} />
      </Modal>
    </>
  );
}


