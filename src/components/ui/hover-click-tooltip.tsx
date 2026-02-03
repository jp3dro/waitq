"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * A tooltip-like popover that supports both hover (desktop) and tap/click (mobile).
 * Use this instead of Radix Tooltip when the content must be accessible on touch devices.
 */
export function HoverClickTooltip({
  children,
  content,
  side = "top",
  align = "center",
  contentClassName,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  contentClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const closeTimeoutRef = React.useRef<number | null>(null);

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const openNow = React.useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const closeNow = React.useCallback(() => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer]);

  const scheduleClose = React.useCallback(() => {
    clearCloseTimer();
    // Small delay prevents "hit and miss" when moving the cursor
    // from the icon to the tooltip content.
    closeTimeoutRef.current = window.setTimeout(() => setOpen(false), 120);
  }, [clearCloseTimer]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        onMouseEnter={openNow}
        onMouseLeave={scheduleClose}
        onFocus={openNow}
        onBlur={closeNow}
        onClick={(e) => {
          // Toggle on click/tap for mobile; keep default focus behavior.
          clearCloseTimer();
          setOpen((v) => !v);
        }}
      >
        {/* Consumers should pass a focusable element (button/link). */}
        {children as any}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={6}
        className={cn(
          "w-fit max-w-xs px-3 py-1.5 text-xs bg-foreground text-background ring-0 shadow-md",
          contentClassName
        )}
        onMouseEnter={openNow}
        onMouseLeave={scheduleClose}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}

