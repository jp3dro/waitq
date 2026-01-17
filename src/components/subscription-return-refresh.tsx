"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toastManager } from "@/hooks/use-toast";

export default function SubscriptionReturnRefresh() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const checkout = url.searchParams.get("checkout");
    const portal = url.searchParams.get("portal");
    const shouldRefresh = checkout === "success" || portal === "return";

    if (!shouldRefresh) return;

    const storageKey = `waitq:subscription:return-refreshed:${checkout || ""}:${portal || ""}`;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(storageKey) === "1") {
      // Still clean URL (in case user came back/forward)
      url.searchParams.delete("checkout");
      url.searchParams.delete("portal");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    try {
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // ignore
    }

    if (checkout === "success") {
      toastManager.add({
        title: "Subscription updated",
        description: "Your plan and limits have been refreshed.",
        type: "success",
      });
    }

    // Remove query flags to avoid repeated refresh loops.
    url.searchParams.delete("checkout");
    url.searchParams.delete("portal");
    window.history.replaceState({}, "", url.toString());

    // Re-render server components (sidebar + plan context) using the updated DB row.
    router.refresh();
  }, [router]);

  return null;
}

