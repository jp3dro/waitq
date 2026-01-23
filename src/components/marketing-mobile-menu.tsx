"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Props = {
  isAuthed: boolean;
};

export default function MarketingMobileMenu({ isAuthed }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="md:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <SheetContent side="right" className="p-0">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="p-5 space-y-6">
          <div className="grid gap-2">
            {isAuthed ? (
              <Button asChild size="sm" onClick={() => setOpen(false)}>
                <Link href="/lists">Open WaitQ</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" onClick={() => setOpen(false)}>
                  <Link href="/signup">Try for free</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  <Link href="/login">Log in</Link>
                </Button>
              </>
            )}
          </div>

          <nav className="space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Features</div>
              <div className="grid">
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link href="/features/self-check-in">Self Check-in</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link href="/features/virtual-waitlist">Virtual Waitlist</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link href="/features/virtual-waiting-room">Virtual Waiting Room</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-1">
              <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                <Link href="/contact">Contact</Link>
              </Button>
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

