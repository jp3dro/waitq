"use client";

import * as React from "react";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

type YouTubeLightboxProps = {
  videoId: string;
  title?: string;
  children: React.ReactNode;
};

export function YouTubeLightbox({ videoId, title = "Demo video", children }: YouTubeLightboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="p-0 sm:max-w-4xl overflow-hidden">
        <div className="aspect-video w-full bg-black">
          {open ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

