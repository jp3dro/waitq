"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
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
          <div className="h-12 border-b border-border px-6 flex items-center">
            <DialogHeader>
              <DialogTitle className="truncate">{title}</DialogTitle>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>

          <div className="sticky bottom-0 h-12 border-t border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center">
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Not now
              </Button>
              <Button asChild>
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

