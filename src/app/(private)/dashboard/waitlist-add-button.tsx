"use client";
import { useState } from "react";
import AddForm from "./waitlist-add-form";
import { Plus } from "lucide-react";
import type { Country } from "react-phone-number-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AddButton({
  defaultWaitlistId,
  lockWaitlist,
  businessCountry,
  disabled,
  disabledReason,
  className,
}: {
  defaultWaitlistId?: string;
  lockWaitlist?: boolean;
  businessCountry?: Country;
  disabled?: boolean;
  disabledReason?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const effectiveBlockedReason = disabled ? (disabledReason || "Restaurant is closed") : blockedReason;
  return (
    <>
      <div className="inline-block" title={effectiveBlockedReason || undefined}>
        <Button
          onClick={() => setOpen(true)}
          disabled={!!effectiveBlockedReason}
          size="sm"
          className={cn("gap-2", className)}
        >
          <Plus className="h-4 w-4" />
          Add to waitlist
        </Button>
      </div>

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
            onBlockedReasonChange={setBlockedReason}
          />

          <DialogFooter className="flex-col sm:flex-row">
            {/* Primary first, Cancel last (esp. on mobile) */}
            <div className="w-full" title={effectiveBlockedReason || undefined}>
              <Button
                type="submit"
                form="add-waitlist-form"
                disabled={pending || !!effectiveBlockedReason}
                className="w-full"
              >
                {pending ? "Adding…" : "Add"}
              </Button>
            </div>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


