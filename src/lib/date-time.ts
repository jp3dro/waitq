import { type TimeFormat } from "@/lib/time-format";

export function formatDateTime(
  date: Date | string | number,
  timeFormat: TimeFormat,
  opts?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(d.getTime())) return String(date);

  const base: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: timeFormat === "12h",
  };

  try {
    return new Intl.DateTimeFormat(undefined, { ...base, ...(opts ?? {}) }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

