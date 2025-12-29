"use client";

import { Button } from "@/components/ui/button";

type Props = {
  lookupKey?: string;
  planId?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export default function SubscribeButton({ lookupKey, planId, children, className, disabled }: Props) {
  async function onClick() {
    if (disabled) return;
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lookupKey, planId }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.url) {
      window.location.href = data.url as string;
    }
  }

  return (
    <Button onClick={onClick} disabled={disabled} className={className} type="button">
      {children}
    </Button>
  );
}


