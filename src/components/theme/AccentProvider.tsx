"use client";

import { useEffect } from "react";
import { applyAccent } from "@/lib/utils";

export function AccentProvider({ initial }: { initial?: string }) {
  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("waitq:accent") : null;
      const hex = initial || stored || "#FF9500";
      applyAccent(hex);
    } catch {
      // ignore
    }
  }, [initial]);
  return null;
}


