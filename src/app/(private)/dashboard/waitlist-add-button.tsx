"use client";
import { useState } from "react";
import AddForm from "./waitlist-add-form";
import { Plus } from "lucide-react";
import type { Country } from "react-phone-number-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AddButton({ defaultWaitlistId, lockWaitlist, businessCountry }: { defaultWaitlistId?: string; lockWaitlist?: boolean; businessCountry?: Country }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add to waitlist
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add to waitlist</DialogTitle>
          </DialogHeader>

          <AddForm
            onDone={() => setOpen(false)}
            defaultWaitlistId={defaultWaitlistId}
            lockWaitlist={lockWaitlist}
            businessCountry={businessCountry}
            onPendingChange={setPending}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-waitlist-form" disabled={pending}>
              {pending ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


