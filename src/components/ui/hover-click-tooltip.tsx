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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          // Toggle on click/tap for mobile; keep default focus behavior.
          e.preventDefault();
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
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}

