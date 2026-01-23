"use client";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { getAllCountries, getTimezonesForCountry } from "countries-and-timezones";
import { toastManager } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput, type Country } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UpgradeRequiredDialog from "@/components/upgrade-required-dialog";
import type { PlanId } from "@/lib/plans";
import { DEFAULT_REGULAR_HOURS, type DayKey, type RegularHours, type TimeRange } from "@/lib/location-hours";
import { normalizeTimeFormat, type TimeFormat } from "@/lib/time-format";

type Location = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  seating_capacity?: number | null;
  regular_hours?: RegularHours | null;
  timezone?: string | null;
  country_code?: string | null;
};

type LocationUpdatePayload = {
  name?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  seatingCapacity?: number | null;
  timezone?: string;
  countryCode?: string;
  regularHours?: RegularHours;
};

const dayOptions: { key: DayKey; label: string }[] = [
  { key: "sun", label: "Sun" },
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
];

const parseTimeToMinutes = (value: string) => {
  const [h, m] = value.split(":").map((v) => Number(v));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
};

const validateDayRanges = (ranges: TimeRange[]) => {
  if (!ranges.length) return null;
  const parsed = ranges.map((r) => ({
    start: parseTimeToMinutes(r.start),
    end: parseTimeToMinutes(r.end),
  }));
  if (parsed.some((r) => r.start === null || r.end === null)) {
    return "Start and end times are required";
  }
  if (parsed.some((r) => (r.start as number) >= (r.end as number))) {
    return "Start time must be earlier than end time";
  }
  const sorted = parsed
    .map((r) => ({ start: r.start as number, end: r.end as number }))
    .sort((a, b) => a.start - b.start);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].start < sorted[i - 1].end) {
      return "Times overlap with another set of times";
    }
  }
  return null;
};

const validateRegularHours = (hours: RegularHours) => {
  const errors: Record<DayKey, string | null> = {
    sun: null,
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
  };
  dayOptions.forEach(({ key }) => {
    errors[key] = validateDayRanges(hours[key] || []);
  });
  return errors;
};

function TimeField({
  value,
  onChange,
  timeFormat,
}: {
  value: string;
  onChange: (next: string) => void;
  timeFormat: TimeFormat;
}) {
  if (timeFormat === "24h") {
    return (
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-28"
      />
    );
  }

  const [hhRaw, mmRaw] = value.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  const safeH = Number.isFinite(hh) ? Math.max(0, Math.min(23, hh)) : 0;
  const safeM = Number.isFinite(mm) ? Math.max(0, Math.min(59, mm)) : 0;
  const ampm: "AM" | "PM" = safeH >= 12 ? "PM" : "AM";
  const hour12 = ((safeH + 11) % 12) + 1;

  const toHHMM = (h12: number, m: number, mer: "AM" | "PM") => {
    let h = h12 % 12;
    if (mer === "PM") h += 12;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const minuteOptions = Array.from({ length: 60 }).map((_, i) => String(i).padStart(2, "0"));
  const hourOptions = Array.from({ length: 12 }).map((_, i) => String(i + 1));

  return (
    <div className="flex items-center gap-1.5">
      <select
        className="h-9 w-[64px] rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={String(hour12)}
        onChange={(e) => onChange(toHHMM(Number(e.target.value), safeM, ampm))}
      >
        {hourOptions.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-sm text-muted-foreground">:</span>
      <select
        className="h-9 w-[64px] rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={String(safeM).padStart(2, "0")}
        onChange={(e) => onChange(toHHMM(hour12, Number(e.target.value), ampm))}
      >
        {minuteOptions.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <select
        className="h-9 w-[72px] rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={ampm}
        onChange={(e) => onChange(toHHMM(hour12, safeM, e.target.value as "AM" | "PM"))}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

function RegularHoursEditor({
  hours,
  onChange,
  errors,
  setErrors,
  timeFormat,
}: {
  hours: RegularHours;
  onChange: (next: RegularHours) => void;
  errors: Record<DayKey, string | null>;
  setErrors: (next: Record<DayKey, string | null>) => void;
  timeFormat: TimeFormat;
}) {
  return (
    <div className="space-y-3 pb-3">
      <Label>Working hours</Label>
      <div className="space-y-1">
        {dayOptions.map((day) => {
          const ranges = hours[day.key] || [];
          const isOpen = ranges.length > 0;
          const error = errors[day.key];
          return (
            <div key={day.key} className="pt-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <Switch
                  checked={isOpen}
                  onCheckedChange={(checked) => {
                    const next: RegularHours = { ...hours };
                    next[day.key] = checked ? [...DEFAULT_REGULAR_HOURS[day.key]] : [];
                    onChange(next);
                    setErrors(validateRegularHours(next));
                  }}
                  className="align-top"
                />
                <span className="w-10 text-sm font-medium py-1">{day.label}</span>
                <div className="flex-1 min-w-[220px]">
                  {isOpen ? (
                    <div className="flex flex-col gap-2">
                      {ranges.map((range, idx) => (
                        <div key={`${day.key}-${idx}`} className="flex items-start gap-2 py-1">
                          <TimeField
                            value={range.start}
                            timeFormat={timeFormat}
                            onChange={(v) => {
                              const next: RegularHours = { ...hours };
                              const dayRanges = [...(next[day.key] || [])];
                              dayRanges[idx] = { ...dayRanges[idx], start: v };
                              next[day.key] = dayRanges;
                              onChange(next);
                              setErrors(validateRegularHours(next));
                            }}
                          />
                          <span className="text-sm text-muted-foreground mt-2">-</span>
                          <TimeField
                            value={range.end}
                            timeFormat={timeFormat}
                            onChange={(v) => {
                              const next: RegularHours = { ...hours };
                              const dayRanges = [...(next[day.key] || [])];
                              dayRanges[idx] = { ...dayRanges[idx], end: v };
                              next[day.key] = dayRanges;
                              onChange(next);
                              setErrors(validateRegularHours(next));
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const next: RegularHours = { ...hours };
                              const dayRanges = [...(next[day.key] || [])];
                              dayRanges.splice(idx, 1);
                              next[day.key] = dayRanges;
                              onChange(next);
                              setErrors(validateRegularHours(next));
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          {idx === 0 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const next: RegularHours = { ...hours };
                                const dayRanges = [...(next[day.key] || [])];
                                dayRanges.push({ start: "12:00", end: "13:00" });
                                next[day.key] = dayRanges;
                                onChange(next);
                                setErrors(validateRegularHours(next));
                              }}
                            >
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Closed</span>
                  )}
                </div>
              </div>
              {error ? <p className="text-xs pl-24 pt-2 text-destructive">{error}</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [planId, setPlanId] = useState<PlanId>("free");
  const [locationLimit, setLocationLimit] = useState<number | null>(null);
  const [createGateStatus, setCreateGateStatus] = useState<"loading" | "ready" | "error">("loading");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [formNameError, setFormNameError] = useState<string | null>(null);
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [formSeatingError, setFormSeatingError] = useState<string | null>(null);
  const [editSeatingError, setEditSeatingError] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; phone: string; address: string; city: string; seatingCapacity: string; timezone: string; countryCode: string }>({
    name: "",
    phone: "",
    address: "",
    city: "",
    seatingCapacity: "",
    timezone: "",
    countryCode: "",
  });
  const [formRegularHours, setFormRegularHours] = useState<RegularHours>(DEFAULT_REGULAR_HOURS);
  const [formHoursErrors, setFormHoursErrors] = useState<Record<DayKey, string | null>>(validateRegularHours(DEFAULT_REGULAR_HOURS));
  const [openCreate, setOpenCreate] = useState(false);
  const [edit, setEdit] = useState<Location | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; phone: string; address: string; city: string; seatingCapacity: string; timezone: string; countryCode: string }>({
    name: "",
    phone: "",
    address: "",
    city: "",
    seatingCapacity: "",
    timezone: "",
    countryCode: "",
  });
  const [editRegularHours, setEditRegularHours] = useState<RegularHours>(DEFAULT_REGULAR_HOURS);
  const [initialRegularHours, setInitialRegularHours] = useState<RegularHours>(DEFAULT_REGULAR_HOURS);
  const [hoursErrors, setHoursErrors] = useState<Record<DayKey, string | null>>(validateRegularHours(DEFAULT_REGULAR_HOURS));
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [businessCountry, setBusinessCountry] = useState<Country>("PT");
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("24h");

  async function load() {
    // Only enable create flow once we have loaded locations + plan.
    // Otherwise, users may click "New location" before we can validate limits.
    setCreateGateStatus("loading");

    const res = await fetch("/api/locations", { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(j?.error ?? "Failed to load locations");
      setLocations([]);
    } else {
      setMsg(null);
      setLocations(j.locations || []);
    }

    const bRes = await fetch("/api/business", { cache: "no-store" });
    const bJ = await bRes.json();
    if (bJ.business?.country_code) {
      setBusinessCountry(bJ.business.country_code as Country);
    }
    if (typeof bJ.business?.time_format === "string") {
      setTimeFormat(normalizeTimeFormat(bJ.business.time_format));
    }

    const pRes = await fetch("/api/plan", { cache: "no-store" });
    const pJ = await pRes.json().catch(() => ({}));
    if (pRes.ok) {
      if (typeof pJ.planId === "string") setPlanId(pJ.planId as PlanId);
      const lim = pJ?.limits?.locations;
      if (typeof lim === "number") setLocationLimit(lim);
    }

    // Gate create: requires successful locations load + numeric limit from /api/plan.
    const locationsOk = res.ok;
    const planOk = pRes.ok && typeof pJ?.limits?.locations === "number";
    const businessOk = bRes.ok;
    setCreateGateStatus(locationsOk && planOk && businessOk ? "ready" : "error");
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    document.title = "Locations - WaitQ";
  }, []);

  const defaultTimezone = useMemo(() => {
    if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
    return "UTC";
  }, []);

  const countryOptions = useMemo(() => {
    const all = getAllCountries();
    return Object.values(all)
      .map((country) => ({
        code: country.id,
        name: country.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const getCountryTimezones = useCallback((code: string) => {
    if (!code) return [];
    return getTimezonesForCountry(code) || [];
  }, []);

  const resolveTimezone = useCallback((countryCode: string, current?: string) => {
    const tzs = getCountryTimezones(countryCode);
    if (!tzs.length) return current || defaultTimezone;
    if (current && tzs.some((tz) => tz.name === current)) return current;
    return tzs[0].name;
  }, [defaultTimezone, getCountryTimezones]);

  const getTimezoneOptions = useCallback((countryCode: string, current?: string) => {
    const tzs = getCountryTimezones(countryCode);
    if (tzs.length) return tzs;
    if (current) return [{ name: current }];
    return [{ name: defaultTimezone }];
  }, [defaultTimezone, getCountryTimezones]);

  useEffect(() => {
    if (!openCreate) return;
    setForm((prev) => {
      const nextCountry = prev.countryCode || businessCountry || "PT";
      const nextTimezone = resolveTimezone(nextCountry, prev.timezone);
      if (prev.countryCode === nextCountry && prev.timezone === nextTimezone) return prev;
      return { ...prev, countryCode: nextCountry, timezone: nextTimezone };
    });
    setFormRegularHours(DEFAULT_REGULAR_HOURS);
    setFormHoursErrors(validateRegularHours(DEFAULT_REGULAR_HOURS));
  }, [openCreate, businessCountry, resolveTimezone]);

  const canDelete = useMemo(() => locations.length > 1, [locations.length]);

  const openCreateFlow = async () => {
    // Never allow opening while gating is unresolved.
    if (createGateStatus !== "ready") return;

    // Gate when the user is at/over their plan's location limit (all tiers).
    if (typeof locationLimit === "number" && locations.length >= locationLimit) {
      setUpgradeOpen(true);
      return;
    }
    setOpenCreate(true);
  };

  const create = () => {
    startTransition(async () => {
      setMsg(null);
      setFormNameError(null);
      setFormSeatingError(null);
      const name = form.name.trim();
      if (!name) {
        setFormNameError("Name is required");
        return;
      }
      const cap = form.seatingCapacity.trim();
      const seatingCapacityNum = Number(cap);
      if (cap && (!Number.isFinite(seatingCapacityNum) || seatingCapacityNum <= 0)) {
        setFormSeatingError("Seating capacity must be a positive number");
        return;
      }
      const currentErrors = validateRegularHours(formRegularHours);
      setFormHoursErrors(currentErrors);
      if (Object.values(currentErrors).some((err) => typeof err === "string" && err.length > 0)) {
        setMsg("Please fix the highlighted hours before saving");
        return;
      }
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          seatingCapacity: cap ? seatingCapacityNum : null,
          countryCode: form.countryCode || businessCountry,
          timezone: resolveTimezone(form.countryCode || businessCountry, form.timezone.trim()),
          regularHours: formRegularHours,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setForm({ name: "", phone: "", address: "", city: "", seatingCapacity: "", timezone: "", countryCode: "" });
        setFormRegularHours(DEFAULT_REGULAR_HOURS);
        setFormHoursErrors(validateRegularHours(DEFAULT_REGULAR_HOURS));
        setOpenCreate(false);
        await load();
      } else {
        // If API returns a structured validation error, map it to the relevant field.
        const errStr = typeof j?.error === "string" ? j.error : null;
        if (errStr && errStr.toLowerCase().includes("name")) {
          setFormNameError(errStr);
        } else {
          setMsg(j?.error ?? "Failed to create");
        }
      }
    });
  };

  const openEditModal = (location: Location) => {
    setEdit(location);
    setEditNameError(null);
    setEditSeatingError(null);
    const countryCode = location.country_code || businessCountry || "";
    setEditForm({
      name: location.name,
      phone: location.phone || "",
      address: location.address || "",
      city: location.city || "",
      seatingCapacity: typeof location.seating_capacity === "number" ? String(location.seating_capacity) : "",
      timezone: resolveTimezone(countryCode, location.timezone || defaultTimezone),
      countryCode,
    });
    const baseHours = location.regular_hours || DEFAULT_REGULAR_HOURS;
    setEditRegularHours(baseHours);
    setInitialRegularHours(baseHours);
    setHoursErrors(validateRegularHours(baseHours));
    setEditMessage(null);
  };

  const closeEditModal = () => {
    setEdit(null);
    setEditForm({ name: "", phone: "", address: "", city: "", seatingCapacity: "", timezone: "", countryCode: "" });
    setEditRegularHours(DEFAULT_REGULAR_HOURS);
    setInitialRegularHours(DEFAULT_REGULAR_HOURS);
    setHoursErrors(validateRegularHours(DEFAULT_REGULAR_HOURS));
    setEditMessage(null);
    setEditNameError(null);
    setEditSeatingError(null);
  };

  const saveEdit = () => {
    if (!edit) return;
    setEditMessage(null);
    setEditNameError(null);
    setEditSeatingError(null);
    startTransition(async () => {
      const updates: Partial<LocationUpdatePayload> = {};
      const currentErrors = validateRegularHours(editRegularHours);
      setHoursErrors(currentErrors);
      if (Object.values(currentErrors).some((err) => typeof err === "string" && err.length > 0)) {
        setEditMessage("Please fix the highlighted hours before saving");
        return;
      }

      if (!editForm.name.trim()) {
        setEditNameError("Name is required");
        return;
      }

      if (editForm.name !== edit.name) {
        updates.name = editForm.name.trim();
      }
      if (editForm.phone !== (edit.phone || "")) {
        updates.phone = editForm.phone.trim() || null;
      }
      if (editForm.address !== (edit.address || "")) {
        updates.address = editForm.address.trim() || null;
      }
      if (editForm.city !== (edit.city || "")) {
        updates.city = editForm.city.trim() || null;
      }
      const cap = editForm.seatingCapacity.trim();
      const seatingCapacityNum = Number(cap);
      const seatingCapacity = cap ? seatingCapacityNum : null;
      if (cap && (!Number.isFinite(seatingCapacityNum) || seatingCapacityNum <= 0)) {
        setEditSeatingError("Seating capacity must be a positive number");
        return;
      }
      const prevCap = typeof edit.seating_capacity === "number" ? edit.seating_capacity : null;
      if (seatingCapacity !== prevCap) {
        updates.seatingCapacity = seatingCapacity;
      }
      const prevTimezone = resolveTimezone(editForm.countryCode || businessCountry || "", edit.timezone || defaultTimezone);
      const nextTimezone = resolveTimezone(editForm.countryCode || businessCountry || "", editForm.timezone.trim());
      if (nextTimezone !== prevTimezone) {
        updates.timezone = nextTimezone;
      }
      const prevCountryCode = edit.country_code || businessCountry || "";
      const nextCountryCode = editForm.countryCode || businessCountry || "";
      if (nextCountryCode && nextCountryCode !== prevCountryCode) {
        updates.countryCode = nextCountryCode;
      }
      if (JSON.stringify(editRegularHours) !== JSON.stringify(initialRegularHours)) {
        updates.regularHours = editRegularHours;
      }

      // If no fields changed, just close modal and show success
      if (Object.keys(updates).length === 0) {
        closeEditModal();
        toastManager.add({
          title: "Success",
          description: "Location updated successfully!",
          type: "success",
        });
        return;
      }

      const res = await fetch("/api/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: edit.id, ...updates }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        closeEditModal();
        await load();
        toastManager.add({
          title: "Success",
          description: "Location updated successfully!",
          type: "success",
        });
      } else {
        const errStr = typeof j?.error === "string" ? j.error : null;
        if (errStr && errStr.toLowerCase().includes("country_code")) {
          setEditMessage("Per-location country is not enabled in this project yet.");
        } else {
          setEditMessage(j?.error ?? "Failed to update");
        }
      }
    });
  };


  const remove = (id: string) => {
    startTransition(async () => {
      setMsg(null);
      if (!canDelete) return;
      const res = await fetch(`/api/locations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        await load();
      } else {
        setMsg(j?.error ?? "Failed to delete");
      }
    });
  };

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Locations</h1>
          <Button
            onClick={openCreateFlow}
            disabled={createGateStatus !== "ready"}
            title={createGateStatus === "ready" ? undefined : "Loading plan…"}
          >
            New location
          </Button>
        </div>

        <div className="space-y-4">
          {msg ? <p className="text-sm text-destructive">{msg}</p> : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((l) => (
              <div key={l.id} className="bg-card text-card-foreground ring-1 ring-border rounded-xl shadow-sm p-5 hover:shadow hover:bg-muted transition">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium">{l.name}</h3>
                  </div>
                {typeof l.seating_capacity === "number" ? (
                  <div className="text-sm text-muted-foreground">
                    Seating capacity: <span className="font-medium text-foreground">{l.seating_capacity}</span>
                  </div>
                ) : null}
                  {l.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <svg className="mr-2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      {l.phone}
                    </div>
                  )}
                  {l.address && (
                    <div className="flex items-start text-sm text-muted-foreground">
                      <svg className="mr-2 h-4 w-4 text-muted-foreground mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.458-7.5 11.458s-7.5-4.316-7.5-11.458a7.5 7.5 0 1115 0z" />
                      </svg>
                      <span>{l.address}</span>
                    </div>
                  )}
                  {l.city && (
                    <div className="flex items-center text-sm text-muted-foreground ml-6">
                      <span>{l.city}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(l)}>
                    Edit
                  </Button>
                  {canDelete && (
                    <button
                      disabled={isPending}
                      onClick={() => remove(l.id)}
                      className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create location (shadcn Dialog) */}
        <Dialog
          open={openCreate}
          onOpenChange={(next) => {
            // Only allow closing via dialog controls/overlay.
            // Opening is gated through `openCreateFlow` which validates plan + permissions.
            if (!next) setOpenCreate(false);
          }}
        >
          <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>New location</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 overflow-y-auto pr-1">
              {msg ? <p className="text-sm text-destructive">{msg}</p> : null}
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, name: v }));
                    if (formNameError && v.trim()) setFormNameError(null);
                  }}
                  aria-invalid={formNameError ? true : undefined}
                  className={formNameError ? "border-destructive focus-visible:ring-destructive" : undefined}
                />
                {formNameError ? <p className="text-xs text-destructive">{formNameError}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <PhoneInput
                  defaultCountry={businessCountry}
                  value={form.phone}
                  onChange={(v: string) => setForm((f) => ({ ...f, phone: v }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Seating capacity</Label>
                <Input
                  inputMode="numeric"
                  value={form.seatingCapacity}
                  onChange={(e) => setForm((f) => ({ ...f, seatingCapacity: e.target.value }))}
                  placeholder="e.g. 80"
                  aria-invalid={formSeatingError ? true : undefined}
                  className={formSeatingError ? "border-destructive focus-visible:ring-destructive" : undefined}
                />
                {formSeatingError ? <p className="text-xs text-destructive">{formSeatingError}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Country</Label>
                  <Select
                    value={form.countryCode || businessCountry}
                    onValueChange={(value) => {
                      const nextTimezone = resolveTimezone(value, form.timezone);
                      setForm((f) => ({ ...f, countryCode: value, timezone: nextTimezone }));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Timezone</Label>
                  <Select
                    value={form.timezone}
                    onValueChange={(value) => setForm((f) => ({ ...f, timezone: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTimezoneOptions(form.countryCode || businessCountry, form.timezone).map((tz) => (
                        <SelectItem key={tz.name} value={tz.name}>
                          {tz.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <RegularHoursEditor
                hours={formRegularHours}
                onChange={setFormRegularHours}
                errors={formHoursErrors}
                setErrors={setFormHoursErrors}
                timeFormat={timeFormat}
              />
            </div>
            <DialogFooter>
              <Button type="button" onClick={create} disabled={isPending}>
                Create
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <UpgradeRequiredDialog
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          title="Upgrade to add more locations"
          description="Your current plan includes a limited number of locations. Upgrade your subscription to unlock multiple locations."
          ctaLabel="View plans"
          ctaHref="/subscriptions"
        />

        {/* Edit location (shadcn Dialog) */}
        <Dialog
          open={!!edit}
          onOpenChange={(open) => {
            if (!open) closeEditModal();
          }}
        >
          <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit location</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 overflow-y-auto pr-1">
              {editMessage ? <p className="text-sm text-destructive">{editMessage}</p> : null}
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditForm((f) => ({ ...f, name: v }));
                    if (editNameError && v.trim()) setEditNameError(null);
                  }}
                  aria-invalid={editNameError ? true : undefined}
                  className={editNameError ? "border-destructive focus-visible:ring-destructive" : undefined}
                />
                {editNameError ? <p className="text-xs text-destructive">{editNameError}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <PhoneInput
                  defaultCountry={businessCountry}
                  value={editForm.phone}
                  onChange={(v: string) => setEditForm((f) => ({ ...f, phone: v }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Seating capacity</Label>
                <Input
                  inputMode="numeric"
                  value={editForm.seatingCapacity}
                  onChange={(e) => setEditForm((f) => ({ ...f, seatingCapacity: e.target.value }))}
                  placeholder="e.g. 80"
                  aria-invalid={editSeatingError ? true : undefined}
                  className={editSeatingError ? "border-destructive focus-visible:ring-destructive" : undefined}
                />
                {editSeatingError ? <p className="text-xs text-destructive">{editSeatingError}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>City</Label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Country</Label>
                  <Select
                    value={editForm.countryCode || businessCountry}
                    onValueChange={(value) => {
                      const nextTimezone = resolveTimezone(value, editForm.timezone);
                      setEditForm((f) => ({ ...f, countryCode: value, timezone: nextTimezone }));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Timezone</Label>
                  <Select
                    value={editForm.timezone}
                    onValueChange={(value) => setEditForm((f) => ({ ...f, timezone: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTimezoneOptions(editForm.countryCode || businessCountry, editForm.timezone).map((tz) => (
                        <SelectItem key={tz.name} value={tz.name}>
                          {tz.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <RegularHoursEditor
                hours={editRegularHours}
                onChange={setEditRegularHours}
                errors={hoursErrors}
                setErrors={setHoursErrors}
                timeFormat={timeFormat}
              />
            </div>
            <DialogFooter>
              <Button type="button" onClick={saveEdit} disabled={isPending}>
                Save changes
              </Button>
              <Button type="button" variant="outline" onClick={closeEditModal}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}


