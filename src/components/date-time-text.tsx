"use client";

import React from "react";
import { useTimeFormat } from "@/components/time-format-provider";
import { formatDateTime } from "@/lib/date-time";

export function DateTimeText({ value }: { value: Date | string | number | null | undefined }) {
  const timeFormat = useTimeFormat();
  if (value === null || typeof value === "undefined") return null;
  return <>{formatDateTime(value, timeFormat)}</>;
}

