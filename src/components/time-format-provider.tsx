"use client";

import React from "react";
import { normalizeTimeFormat, type TimeFormat } from "@/lib/time-format";

const TimeFormatContext = React.createContext<TimeFormat>("24h");

export function TimeFormatProvider({ children }: { children: React.ReactNode }) {
  const [timeFormat, setTimeFormat] = React.useState<TimeFormat>("24h");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/business", { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        const next = normalizeTimeFormat(j?.business?.time_format);
        if (!cancelled) setTimeFormat(next);
      } catch {
        // Keep default.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <TimeFormatContext.Provider value={timeFormat}>{children}</TimeFormatContext.Provider>;
}

export function useTimeFormat() {
  return React.useContext(TimeFormatContext);
}

