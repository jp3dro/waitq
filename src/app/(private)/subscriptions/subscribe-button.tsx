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
};

export default function SubscribeButton({ lookupKey, planId, children, className, disabled, variant, isPortal }: Props) {
  async function onClick() {
    if (disabled) return;

    const endpoint = isPortal ? "/api/stripe/portal" : "/api/stripe/checkout";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isPortal ? {} : { lookupKey, planId }),
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


