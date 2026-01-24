"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function UpgradeRequiredDialog({
  open,
  onOpenChange,
  title = "Upgrade required",
  description = "This feature is not available on the Free plan.",
  ctaLabel = "Upgrade",
  ctaHref = "/subscriptions",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="flex max-h-[90vh] flex-col">
          <div className="px-6 pt-6">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>

          <div className="sticky bottom-0 border-t border-border bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <DialogFooter className="p-0">
              <Button asChild>
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Not now
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

