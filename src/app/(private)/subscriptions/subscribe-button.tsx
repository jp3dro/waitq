"use client";

import { Button } from "@/components/ui/button";

type Props = {
  planId?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  isPortal?: boolean;
  successPath?: string;
  cancelPath?: string;
};

export default function SubscribeButton({ planId, children, className, disabled, variant, isPortal, successPath, cancelPath }: Props) {
  async function onClick() {
    if (disabled) return;

    // Polar routes are GET-based redirects, so we navigate directly rather than fetching JSON.
    if (isPortal) {
      window.location.href = "/api/polar/portal";
      return;
    }

    const url = new URL("/api/polar/checkout", window.location.origin);
    if (planId) url.searchParams.set("planId", planId);
    if (successPath) url.searchParams.set("successPath", successPath);
    if (cancelPath) url.searchParams.set("cancelPath", cancelPath);
    window.location.href = url.toString();
  }

  return (
    <Button onClick={onClick} disabled={disabled} className={className} type="button" variant={variant}>
      {children}
    </Button>
  );
}


