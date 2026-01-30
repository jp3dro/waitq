export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
export type TimeRange = { start: string; end: string };
export type RegularHours = Record<DayKey, TimeRange[]>;

export const DEFAULT_REGULAR_HOURS: RegularHours = {
  sun: [{ start: "00:00", end: "23:59" }],
  mon: [{ start: "00:00", end: "23:59" }],
  tue: [{ start: "00:00", end: "23:59" }],
  wed: [{ start: "00:00", end: "23:59" }],
  thu: [{ start: "00:00", end: "23:59" }],
  fri: [{ start: "00:00", end: "23:59" }],
  sat: [{ start: "00:00", end: "23:59" }],
};

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
  // Allow "24:00" as an alias for end-of-day.
  if (value === "24:00") return 24 * 60;
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

const PREV_DAY_MAP: Record<DayKey, DayKey> = {
  sun: "sat",
  mon: "sun",
  tue: "mon",
  wed: "tue",
  thu: "wed",
  fri: "thu",
  sat: "fri",
};

export function getLocationOpenState(opts: {
  regularHours?: RegularHours | null;
  timezone?: string | null;
  now?: Date;
}): LocationOpenState {
  const timezone = (opts.timezone || "UTC").trim() || "UTC";
  const now = opts.now ?? new Date();
  const { weekday, minutesSinceMidnight, timeLabel } = getZonedParts(now, timezone);
  // If hours are missing, assume the defaults (open all day).
  const hours = opts.regularHours ?? DEFAULT_REGULAR_HOURS;

  const emptyState: LocationOpenState = {
    isOpen: false,
    reason: "Restaurant is closed",
    local: { timezone, weekday, minutesSinceMidnight, timeLabel },
  };

  // Check current day's ranges
  const ranges = Array.isArray(hours[weekday]) ? hours[weekday] : [];
  
  for (const r of ranges) {
    const start = parseTimeToMinutes(r.start);
    let end = parseTimeToMinutes(r.end);
    if (start === null || end === null) continue;
    
    // Treat "23:59" as inclusive end-of-day (i.e. up to 24:00) so "00:00-23:59" is always-open.
    if (end === 23 * 60 + 59) end = 24 * 60;
    
    // Check if this is an overnight range (end < start, e.g., 22:00 to 02:00)
    if (end < start) {
      // Overnight range: open from start until midnight
      if (minutesSinceMidnight >= start) {
        return {
          isOpen: true,
          reason: null,
          local: { timezone, weekday, minutesSinceMidnight, timeLabel },
        };
      }
    } else {
      // Normal range: open from start to end
      if (start <= minutesSinceMidnight && minutesSinceMidnight < end) {
        return {
          isOpen: true,
          reason: null,
          local: { timezone, weekday, minutesSinceMidnight, timeLabel },
        };
      }
    }
  }

  // Check previous day's overnight ranges that might extend into today
  const prevDay = PREV_DAY_MAP[weekday];
  const prevRanges = Array.isArray(hours[prevDay]) ? hours[prevDay] : [];
  
  for (const r of prevRanges) {
    const start = parseTimeToMinutes(r.start);
    const end = parseTimeToMinutes(r.end);
    if (start === null || end === null) continue;
    
    // Only check overnight ranges (end < start)
    if (end < start) {
      // If current time is before the overnight end time, we're still in the previous day's shift
      if (minutesSinceMidnight < end) {
        return {
          isOpen: true,
          reason: null,
          local: { timezone, weekday, minutesSinceMidnight, timeLabel },
        };
      }
    }
  }

  return emptyState;
}

