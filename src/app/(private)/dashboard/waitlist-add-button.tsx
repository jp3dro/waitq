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
  wrapperClassName,
}: {
  defaultWaitlistId?: string;
  lockWaitlist?: boolean;
  businessCountry?: Country;
  disabled?: boolean;
  disabledReason?: string | null;
  className?: string;
  wrapperClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const effectiveBlockedReason = disabled ? (disabledReason || "Restaurant is closed") : blockedReason;
  return (
    <>
      <div className={cn("inline-block", wrapperClassName)} title={effectiveBlockedReason || undefined}>
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
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <div className="flex max-h-[90vh] flex-col">
            <div className="px-6 pt-6">
              <DialogHeader>
                <DialogTitle>Add to waitlist</DialogTitle>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <AddForm
                onDone={() => setOpen(false)}
                defaultWaitlistId={defaultWaitlistId}
                lockWaitlist={lockWaitlist}
                businessCountry={businessCountry}
                onPendingChange={setPending}
                onBlockedReasonChange={setBlockedReason}
              />
            </div>

            <div className="sticky bottom-0 border-t border-border bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <DialogFooter className="flex-col sm:flex-row p-0">
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


