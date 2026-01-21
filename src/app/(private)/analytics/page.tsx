"use client";
import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreatedRow = { created_at: string };
type ServedRow = { created_at: string; notified_at: string | null; waitlist_id: string | null };

type AnalyticsData = {
  totalVisitors: number;
  dailyVisitors: { date: string; count: number }[];
  dailyAvg: number;
  avgHourlyVisits: { hour: number; avg: number }[];
  avgByWeekday: { weekday: number; avg: number }[];
  avgWaitTimeMin: number;
  avgServiceTimeMin: number;
  avgWaitByHour: { hour: number; avgMin: number }[];
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type LocationRow = { id: string; name: string };
type WaitlistRow = { id: string; name: string; location_id: string | null };

type InteractiveBarChartDatum = {
  label: string;
  value: number;
};

const interactiveChartConfig = {
  value: {
    label: "Value",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function formatIfISODateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ChartBarInteractiveMetric({
  title,
  data,
  height = 250,
  xTickFormatter,
  insight,
}: {
  title: string;
  data: InteractiveBarChartDatum[];
  height?: number;
  xTickFormatter?: (value: string) => string;
  insight?: string | null;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={interactiveChartConfig} className="aspect-auto w-full" style={{ height }}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                xTickFormatter ? xTickFormatter(String(value)) : formatIfISODateLabel(String(value))
              }
            />
            <ChartTooltip
              content={<ChartTooltipContent className="w-[170px]" labelFormatter={(value) => String(value)} />}
            />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
          </BarChart>
        </ChartContainer>
        {insight ? <p className="mt-3 text-xs text-muted-foreground">{insight}</p> : null}
      </CardContent>
    </Card>
  );
}

const weekdayCustomLabelConfig = {
  value: {
    label: "Average",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig;

function ChartBarCustomLabelWeekday({
  title,
  data,
  insight,
}: {
  title: string;
  data: { day: string; value: number }[];
  insight?: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={weekdayCustomLabelConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="day"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value).slice(0, 3)}
              hide
            />
            <XAxis dataKey="value" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Bar dataKey="value" layout="vertical" fill="var(--color-value)" radius={4}>
              <LabelList dataKey="day" position="insideLeft" offset={8} className="fill-(--color-label)" fontSize={12} />
              <LabelList dataKey="value" position="right" offset={8} className="fill-foreground" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
        {insight ? <p className="mt-3 text-xs text-muted-foreground">{insight}</p> : null}
      </CardContent>
    </Card>
  );
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function fmtHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function maxBy<T>(arr: T[], get: (v: T) => number) {
  let best: T | null = null;
  let bestVal = -Infinity;
  for (const it of arr) {
    const v = get(it);
    if (v > bestVal) {
      bestVal = v;
      best = it;
    }
  }
  return best;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [rangeMode, setRangeMode] = React.useState<"today" | "7" | "15" | "30">("today");
  const [locations, setLocations] = React.useState<LocationRow[]>([]);
  const [waitlists, setWaitlists] = React.useState<WaitlistRow[]>([]);
  const [locationId, setLocationId] = React.useState<string>("all");
  const [waitlistId, setWaitlistId] = React.useState<string>("all");
  const supabase = createClient();
  const hasLoadedRef = React.useRef(false);
  const requestIdRef = React.useRef(0);

  const loadAnalytics = React.useCallback(async (opts: { mode: "today" | "range"; days: 7 | 15 | 30; waitlistIds: string[] | null }) => {
    const requestId = ++requestIdRef.current;
    try {
      if (!hasLoadedRef.current) setLoading(true);
      else setIsRefreshing(true);

      // Date range
      const now = new Date();
      const from =
        opts.mode === "today" ? startOfLocalDay(now) : new Date(now.getTime() - opts.days * 24 * 60 * 60 * 1000);

      const makeCreatedQuery = (f: Date, t: Date) => {
        let q = supabase.from("waitlist_entries").select("created_at").gte("created_at", f.toISOString()).lte("created_at", t.toISOString());
        if (opts.waitlistIds && opts.waitlistIds.length) q = q.in("waitlist_id", opts.waitlistIds);
        return q.limit(5000);
      };
      const makeServedQuery = (f: Date, t: Date) => {
        let q = supabase
          .from("waitlist_entries")
          .select("created_at, notified_at, waitlist_id")
          .in("status", ["notified", "seated"])
          .not("notified_at", "is", null)
          .gte("created_at", f.toISOString())
          .lte("created_at", t.toISOString());
        if (opts.waitlistIds && opts.waitlistIds.length) q = q.in("waitlist_id", opts.waitlistIds);
        return q.limit(5000);
      };

      const [createdRowsRes, servedRowsRes] = await Promise.all([
        makeCreatedQuery(from, now),
        makeServedQuery(from, now),
      ]);

      const createdRows = (createdRowsRes.data ?? []) as CreatedRow[];
      const servedRows = (servedRowsRes.data ?? []) as ServedRow[];

      // Total visitors
      const totalVisitors = createdRows.length;

      // Daily visitors series for the range
      const dayCounts = new Map<string, number>();
      const daysCount = opts.mode === "today" ? 1 : opts.days;
      for (let d = 0; d < daysCount; d++) {
        const dt = new Date(now.getTime() - (daysCount - 1 - d) * 86400000);
        const key = dt.toISOString().slice(0, 10);
        dayCounts.set(key, 0);
      }
      createdRows.forEach((r) => {
        const key = new Date(r.created_at).toISOString().slice(0, 10);
        if (dayCounts.has(key)) dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
      });
      const dailyVisitors = Array.from(dayCounts.entries()).map(([date, count]) => ({ date, count }));

      // Daily average (only meaningful when range > 1 day)
      const dailyAvg = (opts.mode === "today" || daysCount <= 1) ? totalVisitors : Math.round(totalVisitors / daysCount);

      // Average hourly visits (per hour across days)
      const hourlyTotals: Record<number, number> = {};
      createdRows.forEach((r) => {
        const h = new Date(r.created_at).getHours();
        hourlyTotals[h] = (hourlyTotals[h] || 0) + 1;
      });
      const avgHourlyVisits = Array.from({ length: 24 }).map((_, h) => ({ hour: h, avg: +(((hourlyTotals[h] || 0) / daysCount) as number).toFixed(2) }));


      // Average visitors by day of week (0=Sun..6=Sat)
      const weekdayTotals: Record<number, number> = {};
      const weekdayOccurrences: Record<number, number> = {};
      // Count how many times each weekday occurs in the selected range
      for (let d = 0; d < daysCount; d++) {
        const dt = new Date(now.getTime() - d * 86400000);
        weekdayOccurrences[dt.getDay()] = (weekdayOccurrences[dt.getDay()] || 0) + 1;
      }
      createdRows.forEach((r) => {
        const wd = new Date(r.created_at).getDay();
        weekdayTotals[wd] = (weekdayTotals[wd] || 0) + 1;
      });
      const avgByWeekday = Array.from({ length: 7 }).map((_, wd) => {
        const occ = weekdayOccurrences[wd] || 1;
        const avg = (weekdayTotals[wd] || 0) / occ;
        return { weekday: wd, avg: +avg.toFixed(2) };
      });

      // Average wait time (created -> notified) in minutes
      const waitDiffs = servedRows
        .map((r) => (r.notified_at ? new Date(r.notified_at).getTime() - new Date(r.created_at).getTime() : 0))
        .filter((ms: number) => ms > 0 && ms < 24 * 60 * 60 * 1000);
      const avgWaitTimeMin = waitDiffs.length ? Math.round(waitDiffs.reduce((a, b) => a + b, 0) / waitDiffs.length / 60000) : 0;

      // Approximate service time: average gap between consecutive notified_at (throughput)
      const notifiedTimes = servedRows
        .map((r) => (r.notified_at ? new Date(r.notified_at).getTime() : NaN))
        .filter((t: number) => !isNaN(t))
        .sort((a: number, b: number) => a - b);
      const serviceGaps: number[] = [];
      for (let i = 1; i < notifiedTimes.length; i++) {
        const gap = notifiedTimes[i] - notifiedTimes[i - 1];
        if (gap > 0 && gap < 8 * 60 * 60 * 1000) serviceGaps.push(gap);
      }
      const avgServiceTimeMin = serviceGaps.length ? Math.round(serviceGaps.reduce((a, b) => a + b, 0) / serviceGaps.length / 60000) : 0;

      // Average wait time by hour of day (based on created_at hour)
      const hourWaitSums: Record<number, number> = {};
      const hourWaitCounts: Record<number, number> = {};
      servedRows.forEach((r) => {
        const created = new Date(r.created_at);
        const notified = r.notified_at ? new Date(r.notified_at) : null;
        if (!notified) return;
        const diffMs = notified.getTime() - created.getTime();
        if (diffMs <= 0 || diffMs > 24 * 60 * 60 * 1000) return;
        const hour = created.getHours();
        hourWaitSums[hour] = (hourWaitSums[hour] || 0) + diffMs;
        hourWaitCounts[hour] = (hourWaitCounts[hour] || 0) + 1;
      });
      const avgWaitByHour = Array.from({ length: 24 }).map((_, h) => {
        const sum = hourWaitSums[h] || 0;
        const cnt = hourWaitCounts[h] || 0;
        const avgMin = cnt ? Math.round(sum / cnt / 60000) : 0;
        return { hour: h, avgMin };
      });

      if (requestId !== requestIdRef.current) return;

      setAnalytics({
        totalVisitors,
        dailyVisitors,
        dailyAvg,
        avgHourlyVisits,
        avgByWeekday,
        avgWaitTimeMin,
        avgServiceTimeMin,
        avgWaitByHour,
      });
      hasLoadedRef.current = true;

    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [supabase]);

  React.useEffect(() => {
    // Load filter options (client-side, RLS-scoped)
    (async () => {
      try {
        const [locRes, wlRes] = await Promise.all([
          supabase.from("business_locations").select("id, name").order("name"),
          supabase.from("waitlists").select("id, name, location_id").order("created_at", { ascending: true }),
        ]);
        setLocations((locRes.data ?? []) as LocationRow[]);
        setWaitlists((wlRes.data ?? []) as WaitlistRow[]);
      } catch (e) {
        console.error("Failed to load analytics filters:", e);
      }
    })();
  }, [supabase]);

  React.useEffect(() => {
    const days: 7 | 15 | 30 = rangeMode === "15" ? 15 : rangeMode === "30" ? 30 : 7;
    const mode = rangeMode === "today" ? "today" : "range";
    const candidateWaitlists = waitlists
      .filter((w) => (locationId === "all" ? true : w.location_id === locationId))
      .filter((w) => (waitlistId === "all" ? true : w.id === waitlistId));
    const wlIds = (locationId === "all" && waitlistId === "all") ? null : candidateWaitlists.map((w) => w.id);
    loadAnalytics({ mode, days, waitlistIds: wlIds });
  }, [loadAnalytics, rangeMode, locationId, waitlistId, waitlists]);

  if (loading && !analytics) {
    return (
      <main className="py-5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
        </div>
      </main>
    );
  }

  if (!analytics) {
    return (
      <main className="py-5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-10 text-center">
            <h3 className="text-base font-semibold">No analytics</h3>
            <p className="mt-1 text-sm text-muted-foreground">Unable to load analytics data</p>
          </div>
        </div>
      </main>
    );
  }

  const busiestDay = maxBy(analytics.dailyVisitors, (d) => d.count);
  const busiestDayLabel = busiestDay ? formatIfISODateLabel(busiestDay.date) : null;
  const busiestHour = maxBy(analytics.avgHourlyVisits, (h) => h.avg);
  const busiestWeekday = maxBy(analytics.avgByWeekday, (w) => w.avg);
  const worstWaitHour = maxBy(analytics.avgWaitByHour, (h) => h.avgMin);

  const isToday = rangeMode === "today";

  const insightHourlyVisits =
    busiestHour && busiestHour.avg > 0
      ? (isToday
        ? `Peak hour: ${fmtHourLabel(busiestHour.hour)} (${busiestHour.avg} visits)`
        : `Peak hour: ${fmtHourLabel(busiestHour.hour)} (avg ${busiestHour.avg} visits/day)`)
      : "No visits recorded in this period.";
  const insightWeekday =
    busiestWeekday && busiestWeekday.avg > 0
      ? `Busiest weekday: ${DAY_LABELS[busiestWeekday.weekday] ?? busiestWeekday.weekday} (avg ${busiestWeekday.avg})`
      : "No weekday pattern available for this period.";
  const insightWaitByHour =
    worstWaitHour && worstWaitHour.avgMin > 0
      ? `Highest average wait: ${fmtHourLabel(worstWaitHour.hour)} (${worstWaitHour.avgMin}m)`
      : "No wait-time data available for this period.";
  const insightDailyVisitors =
    busiestDay && busiestDay.count > 0 && busiestDayLabel
      ? `Busiest day: ${busiestDayLabel} (${busiestDay.count} visitors)`
      : "No visitors recorded in this period.";

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <Tabs value={rangeMode} onValueChange={(v) => setRangeMode(v as "today" | "7" | "15" | "30")}>
            <TabsList variant="default">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="7">Last 7 days</TabsTrigger>
              <TabsTrigger value="15">Last 15 days</TabsTrigger>
              <TabsTrigger value="30">Last 30 days</TabsTrigger>
            </TabsList>
          </Tabs>
          {isRefreshing ? <Spinner className="ml-1" /> : null}
        </div>

        {/* Analytics content container */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-64">
              <Select
                value={locationId}
                onValueChange={(v) => {
                  setLocationId(v);
                  // When changing location, reset list filter (to avoid selecting a list from another location)
                  setWaitlistId("all");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-64">
              <Select value={waitlistId} onValueChange={(v) => setWaitlistId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="List" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All lists</SelectItem>
                  {waitlists
                    .filter((w) => (locationId === "all" ? true : w.location_id === locationId))
                    .map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{isToday ? "Visitors today" : "Total visitors"}</p>
              <p className="mt-0.5 text-lg font-semibold">{analytics.totalVisitors.toLocaleString()}</p>
            </div>
            {!isToday ? (
              <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Daily average</p>
                <p className="mt-0.5 text-lg font-semibold">{analytics.dailyAvg}</p>
              </div>
            ) : (
              <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Today (so far)</p>
                <p className="mt-0.5 text-lg font-semibold">{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            )}
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Avg wait time</p>
              <p className="mt-0.5 text-lg font-semibold">{(() => { const m = analytics.avgWaitTimeMin; const h = Math.floor(m/60); const mm = m % 60; return h > 0 ? `${h}h ${mm}m` : `${mm}m`; })()}</p>
            </div>
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Avg service time</p>
              <p className="mt-0.5 text-lg font-semibold">{(() => { const m = analytics.avgServiceTimeMin; const h = Math.floor(m/60); const mm = m % 60; return h > 0 ? `${h}h ${mm}m` : `${mm}m`; })()}</p>
            </div>
          </div>

          {/* Daily visitors removed here to avoid duplication; see 2x2 grid below */}

          {/* Charts 2x2 grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartBarInteractiveMetric
              title={isToday ? "Hourly visits" : "Average hourly visits"}
              data={analytics.avgHourlyVisits.map((h) => ({
                label: fmtHourLabel(h.hour),
                value: h.avg,
              }))}
              xTickFormatter={(v) => v}
              insight={insightHourlyVisits}
            />
            <ChartBarInteractiveMetric
              title="Average wait time by time of day"
              data={analytics.avgWaitByHour.map((h) => ({
                label: fmtHourLabel(h.hour),
                value: h.avgMin,
              }))}
              xTickFormatter={(v) => v}
              insight={insightWaitByHour}
            />
            <ChartBarInteractiveMetric
              title={rangeMode === "today" ? "Daily visitors (today)" : `Daily visitors (last ${rangeMode} days)`}
              data={analytics.dailyVisitors.map((d) => ({
                label: d.date,
                value: d.count,
              }))}
              xTickFormatter={(v) => formatIfISODateLabel(v)}
              insight={insightDailyVisitors}
            />
            {!isToday ? (
              <ChartBarCustomLabelWeekday
                title="Average visitors by day of week"
                data={analytics.avgByWeekday.map((w) => ({
                  day: DAY_LABELS[w.weekday] ?? String(w.weekday),
                  value: w.avg,
                }))}
                insight={insightWeekday}
              />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
