"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

type YouTubeLightboxProps = {
  videoId: string;
  title?: string;
  children: React.ReactNode;
};

export function YouTubeLightbox({ videoId, title = "Demo video", children }: YouTubeLightboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50"
          )}
        />

        <DialogPrimitive.Content
          className={cn(
            "bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 ring-1 duration-100 max-w-[calc(100%-2rem)] sm:max-w-4xl overflow-hidden rounded-xl"
          )}
        >
        <div className="h-12 px-3 sm:px-4 border-b bg-background/95 supports-backdrop-filter:backdrop-blur flex items-center justify-between gap-3">
          <DialogPrimitive.Title className="text-lg font-medium">{title}</DialogPrimitive.Title>
        </div>

        <div className="aspect-video w-full bg-black">
          {open ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : null}
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

