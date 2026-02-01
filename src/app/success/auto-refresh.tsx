"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Poll server components for a short period so `/success` can auto-redirect
 * once the Polar webhook updates the `subscriptions` row.
 */
export function SuccessAutoRefresh({ maxMs = 20000, intervalMs = 1500 }: { maxMs?: number; intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      if (Date.now() - start > maxMs) {
        window.clearInterval(id);
        return;
      }
      router.refresh();
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, maxMs, router]);

  return null;
}

