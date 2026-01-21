export type TimeFormat = "24h" | "12h";

export function normalizeTimeFormat(v: unknown): TimeFormat {
  return v === "12h" ? "12h" : "24h";
}

export function formatTimeOfDay(hhmm: string, format: TimeFormat): string {
  const [hhRaw, mmRaw] = hhmm.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return hhmm;
  if (format === "24h") return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

export function hourToLabel(hour24: number, format: TimeFormat): string {
  const h = Math.max(0, Math.min(23, Math.floor(hour24)));
  return formatTimeOfDay(`${String(h).padStart(2, "0")}:00`, format);
}

export function dateToClockLabel(d: Date, format: TimeFormat): string {
  const hh = d.getHours();
  const mm = d.getMinutes();
  return formatTimeOfDay(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, format);
}

export function parseTimeOfDayToHHMM(input: string, format: TimeFormat): string | null {
  const t = input.trim();
  if (!t) return null;

  // Always accept 24h "HH:MM"
  const m24 = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (m24) {
    const hh = Number(m24[1]);
    const mm = Number(m24[2]);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }

  if (format === "24h") return null;

  // 12h examples: "3:05 PM", "3 PM", "12:00 am"
  const m12 = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i.exec(t);
  if (!m12) return null;
  let h = Number(m12[1]);
  const mm = typeof m12[2] === "string" ? Number(m12[2]) : 0;
  const ampm = m12[3].toLowerCase();
  if (h < 1 || h > 12 || mm < 0 || mm > 59) return null;
  if (ampm === "pm" && h !== 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

