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
            <div className="h-12 border-b border-border px-6 flex items-center">
              <DialogHeader>
                <DialogTitle className="truncate">Add to waitlist</DialogTitle>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <AddForm
                onDone={() => setOpen(false)}
                defaultWaitlistId={defaultWaitlistId}
                lockWaitlist={lockWaitlist}
                businessCountry={businessCountry}
                onPendingChange={setPending}
                onBlockedReasonChange={setBlockedReason}
              />
            </div>

            <div className="sticky bottom-0 h-12 border-t border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center">
              <div className="ml-auto flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <div title={effectiveBlockedReason || undefined}>
                  <Button
                    type="submit"
                    form="add-waitlist-form"
                    disabled={pending || !!effectiveBlockedReason}
                  >
                    {pending ? "Adding…" : "Add"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


