"use client";

import { Button } from "@/components/ui/button";

type Props = {
  lookupKey?: string;
  planId?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  isPortal?: boolean;
  successPath?: string;
  cancelPath?: string;
  billingProvider?: "stripe" | "polar";
};

export default function SubscribeButton({ lookupKey, planId, children, className, disabled, variant, isPortal, successPath, cancelPath, billingProvider }: Props) {
  async function onClick() {
    if (disabled) return;

    const provider = billingProvider || process.env.NEXT_PUBLIC_BILLING_PROVIDER || "stripe";

    // Polar routes are GET-based redirects, so we navigate directly rather than fetching JSON.
    if (provider === "polar") {
      if (isPortal) {
        window.location.href = "/api/polar/portal";
        return;
      }
      const url = new URL("/api/polar/checkout", window.location.origin);
      if (planId) url.searchParams.set("planId", planId);
      if (successPath) url.searchParams.set("successPath", successPath);
      if (cancelPath) url.searchParams.set("cancelPath", cancelPath);
      window.location.href = url.toString();
      return;
    }

    const endpoint = isPortal ? "/api/stripe/portal" : "/api/stripe/checkout";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isPortal ? {} : { lookupKey, planId, successPath, cancelPath }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.url) {
      window.location.href = data.url as string;
    }
  }

  return (
    <Button onClick={onClick} disabled={disabled} className={className} type="button" variant={variant}>
      {children}
    </Button>
  );
}


