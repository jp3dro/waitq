export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
export type TimeRange = { start: string; end: string };
export type RegularHours = Record<DayKey, TimeRange[]>;

export type LocationOpenState = {
  isOpen: boolean;
  reason: string | null;
  local: {
    timezone: string;
    weekday: DayKey;
    minutesSinceMidnight: number;
    timeLabel: string; // e.g. "13:05"
  };
};

const WEEKDAY_MAP: Record<string, DayKey> = {
  sun: "sun",
  mon: "mon",
  tue: "tue",
  wed: "wed",
  thu: "thu",
  fri: "fri",
  sat: "sat",
};

function parseTimeToMinutes(value: string) {
  const [h, m] = value.split(":").map((v) => Number(v));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getZonedParts(now: Date, timezone: string) {
  // Use formatToParts to avoid locale parsing issues.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const weekdayRaw = (parts.find((p) => p.type === "weekday")?.value || "").toLowerCase().slice(0, 3);
  const hourRaw = parts.find((p) => p.type === "hour")?.value;
  const minuteRaw = parts.find((p) => p.type === "minute")?.value;
  const weekday = WEEKDAY_MAP[weekdayRaw] || "sun";
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const minutesSinceMidnight = (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
  return { weekday, minutesSinceMidnight, timeLabel: `${pad2(Number.isFinite(hour) ? hour : 0)}:${pad2(Number.isFinite(minute) ? minute : 0)}` };
}

export function getLocationOpenState(opts: {
  regularHours?: RegularHours | null;
  timezone?: string | null;
  now?: Date;
}): LocationOpenState {
  const timezone = (opts.timezone || "UTC").trim() || "UTC";
  const now = opts.now ?? new Date();
  const { weekday, minutesSinceMidnight, timeLabel } = getZonedParts(now, timezone);
  const hours = opts.regularHours || null;

  const emptyState: LocationOpenState = {
    isOpen: false,
    reason: "Restaurant is closed",
    local: { timezone, weekday, minutesSinceMidnight, timeLabel },
  };

  if (!hours) return emptyState;
  const ranges = Array.isArray(hours[weekday]) ? hours[weekday] : [];
  if (!ranges.length) return emptyState;

  for (const r of ranges) {
    const start = parseTimeToMinutes(r.start);
    const end = parseTimeToMinutes(r.end);
    if (start === null || end === null) continue;
    if (start <= minutesSinceMidnight && minutesSinceMidnight < end) {
      return {
        isOpen: true,
        reason: null,
        local: { timezone, weekday, minutesSinceMidnight, timeLabel },
      };
    }
  }

  return emptyState;
}

