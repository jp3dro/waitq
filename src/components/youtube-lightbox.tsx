"use client";

import * as React from "react";
import Link from "next/link";

import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

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
        <div className="h-12 px-3 sm:px-4 border-b bg-background/95 supports-backdrop-filter:backdrop-blur flex items-center justify-between gap-3">
          <DialogTitle className="text-lg font-medium">{title} </DialogTitle>
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
      </DialogContent>
    </Dialog>
  );
}

