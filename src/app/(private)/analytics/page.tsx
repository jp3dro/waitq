"use client";
import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

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
  compare: {
    dailyVisitors: { label: string; current: number; previous: number }[];
    avgHourlyVisits: { label: string; current: number; previous: number }[];
    avgWaitByHour: { label: string; current: number; previous: number }[];
  };
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type InteractiveBarChartDatum = {
  label: string;
  current: number;
  previous: number;
};

const interactiveChartConfig = {
  current: {
    label: "Current",
    color: "var(--chart-2)",
  },
  previous: {
    label: "Previous",
    color: "var(--chart-1)",
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
}: {
  title: string;
  data: InteractiveBarChartDatum[];
  height?: number;
  xTickFormatter?: (value: string) => string;
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
            <Bar dataKey="previous" fill="var(--color-previous)" radius={4} />
            <Bar dataKey="current" fill="var(--color-current)" radius={4} />
          </BarChart>
        </ChartContainer>
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
}: {
  title: string;
  data: { day: string; value: number }[];
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
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [rangeDays, setRangeDays] = React.useState<7 | 15 | 30>(7);
  const supabase = createClient();
  const hasLoadedRef = React.useRef(false);
  const requestIdRef = React.useRef(0);

  const loadAnalytics = React.useCallback(async (days: 7 | 15 | 30) => {
    const requestId = ++requestIdRef.current;
    try {
      if (!hasLoadedRef.current) setLoading(true);
      else setIsRefreshing(true);

      // Date range
      const now = new Date();
      const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const prevFrom = new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
      const prevTo = new Date(from.getTime());

      const [createdRowsRes, servedRowsRes, createdRowsPrevRes, servedRowsPrevRes] = await Promise.all([
        supabase
          .from("waitlist_entries")
          .select("created_at")
          .gte("created_at", from.toISOString())
          .lte("created_at", now.toISOString())
          .limit(5000),
        supabase
          .from("waitlist_entries")
          .select("created_at, notified_at, waitlist_id")
          .in("status", ["notified", "seated"]) // served-like
          .not("notified_at", "is", null)
          .gte("created_at", from.toISOString())
          .lte("created_at", now.toISOString())
          .limit(5000)
        ,
        supabase
          .from("waitlist_entries")
          .select("created_at")
          .gte("created_at", prevFrom.toISOString())
          .lt("created_at", prevTo.toISOString())
          .limit(5000),
        supabase
          .from("waitlist_entries")
          .select("created_at, notified_at, waitlist_id")
          .in("status", ["notified", "seated"]) // served-like
          .not("notified_at", "is", null)
          .gte("created_at", prevFrom.toISOString())
          .lt("created_at", prevTo.toISOString())
          .limit(5000),
      ]);

      const createdRows = (createdRowsRes.data ?? []) as CreatedRow[];
      const servedRows = (servedRowsRes.data ?? []) as ServedRow[];
      const createdRowsPrev = (createdRowsPrevRes.data ?? []) as CreatedRow[];
      const servedRowsPrev = (servedRowsPrevRes.data ?? []) as ServedRow[];

      // Total visitors
      const totalVisitors = createdRows.length;

      // Daily visitors series for the range
      const dayCounts = new Map<string, number>();
      for (let d = 0; d < days; d++) {
        const dt = new Date(now.getTime() - (days - 1 - d) * 86400000);
        const key = dt.toISOString().slice(0, 10);
        dayCounts.set(key, 0);
      }
      createdRows.forEach((r) => {
        const key = new Date(r.created_at).toISOString().slice(0, 10);
        if (dayCounts.has(key)) dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
      });
      const dailyVisitors = Array.from(dayCounts.entries()).map(([date, count]) => ({ date, count }));

      const dayCountsPrev = new Map<string, number>();
      for (let d = 0; d < days; d++) {
        const dt = new Date(prevTo.getTime() - (days - 1 - d) * 86400000);
        const key = dt.toISOString().slice(0, 10);
        dayCountsPrev.set(key, 0);
      }
      createdRowsPrev.forEach((r) => {
        const key = new Date(r.created_at).toISOString().slice(0, 10);
        if (dayCountsPrev.has(key)) dayCountsPrev.set(key, (dayCountsPrev.get(key) || 0) + 1);
      });
      const dailyVisitorsPrev = Array.from(dayCountsPrev.entries()).map(([date, count]) => ({ date, count }));

      // Daily average
      const dailyAvg = days > 0 ? Math.round(totalVisitors / days) : 0;

      // Average hourly visits (per hour across days)
      const hourlyTotals: Record<number, number> = {};
      createdRows.forEach((r) => {
        const h = new Date(r.created_at).getHours();
        hourlyTotals[h] = (hourlyTotals[h] || 0) + 1;
      });
      const avgHourlyVisits = Array.from({ length: 24 }).map((_, h) => ({ hour: h, avg: +( (hourlyTotals[h] || 0) / days ).toFixed(2) }));

      const hourlyTotalsPrev: Record<number, number> = {};
      createdRowsPrev.forEach((r) => {
        const h = new Date(r.created_at).getHours();
        hourlyTotalsPrev[h] = (hourlyTotalsPrev[h] || 0) + 1;
      });
      const avgHourlyVisitsPrev = Array.from({ length: 24 }).map((_, h) => ({
        hour: h,
        avg: +(((hourlyTotalsPrev[h] || 0) / days) as number).toFixed(2),
      }));

      // Average visitors by day of week (0=Sun..6=Sat)
      const weekdayTotals: Record<number, number> = {};
      const weekdayOccurrences: Record<number, number> = {};
      // Count how many times each weekday occurs in the selected range
      for (let d = 0; d < days; d++) {
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

      const hourWaitSumsPrev: Record<number, number> = {};
      const hourWaitCountsPrev: Record<number, number> = {};
      servedRowsPrev.forEach((r) => {
        const created = new Date(r.created_at);
        const notified = r.notified_at ? new Date(r.notified_at) : null;
        if (!notified) return;
        const diffMs = notified.getTime() - created.getTime();
        if (diffMs <= 0 || diffMs > 24 * 60 * 60 * 1000) return;
        const hour = created.getHours();
        hourWaitSumsPrev[hour] = (hourWaitSumsPrev[hour] || 0) + diffMs;
        hourWaitCountsPrev[hour] = (hourWaitCountsPrev[hour] || 0) + 1;
      });
      const avgWaitByHourPrev = Array.from({ length: 24 }).map((_, h) => {
        const sum = hourWaitSumsPrev[h] || 0;
        const cnt = hourWaitCountsPrev[h] || 0;
        const avgMin = cnt ? Math.round(sum / cnt / 60000) : 0;
        return { hour: h, avgMin };
      });

      const compareDailyVisitors = Array.from({ length: days }).map((_, i) => {
        const cur = dailyVisitors[i];
        const prev = dailyVisitorsPrev[i];
        return { label: cur?.date ?? String(i + 1), current: cur?.count ?? 0, previous: prev?.count ?? 0 };
      });

      const compareAvgHourlyVisits = Array.from({ length: 24 }).map((_, i) => {
        const cur = avgHourlyVisits[i];
        const prev = avgHourlyVisitsPrev[i];
        const label = `${String(i).padStart(2, "0")}:00`;
        return { label, current: cur?.avg ?? 0, previous: prev?.avg ?? 0 };
      });

      const compareAvgWaitByHour = Array.from({ length: 24 }).map((_, i) => {
        const cur = avgWaitByHour[i];
        const prev = avgWaitByHourPrev[i];
        const label = `${String(i).padStart(2, "0")}:00`;
        return { label, current: cur?.avgMin ?? 0, previous: prev?.avgMin ?? 0 };
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
        compare: {
          dailyVisitors: compareDailyVisitors,
          avgHourlyVisits: compareAvgHourlyVisits,
          avgWaitByHour: compareAvgWaitByHour,
        },
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
    loadAnalytics(rangeDays);
  }, [loadAnalytics, rangeDays]);

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

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <Tabs value={String(rangeDays)} onValueChange={(v) => setRangeDays(parseInt(v, 10) as 7 | 15 | 30)}>
            <TabsList variant="default">
              <TabsTrigger value="7">Last 7 days</TabsTrigger>
              <TabsTrigger value="15">Last 15 days</TabsTrigger>
              <TabsTrigger value="30">Last 30 days</TabsTrigger>
            </TabsList>
          </Tabs>
          {isRefreshing ? <Spinner className="ml-1" /> : null}
        </div>

        {/* Analytics content container */}
        <div className="space-y-6">
          

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Total visitors</p>
              <p className="mt-0.5 text-lg font-semibold">{analytics.totalVisitors.toLocaleString()}</p>
            </div>
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Daily average</p>
              <p className="mt-0.5 text-lg font-semibold">{analytics.dailyAvg}</p>
            </div>
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
              title="Average hourly visits"
              data={analytics.compare.avgHourlyVisits}
              xTickFormatter={(v) => v}
            />
            <ChartBarCustomLabelWeekday
              title="Average visitors by day of week"
              data={analytics.avgByWeekday.map((w) => ({
                day: DAY_LABELS[w.weekday] ?? String(w.weekday),
                value: w.avg,
              }))}
            />
            <ChartBarInteractiveMetric
              title="Average wait time by time of day"
              data={analytics.compare.avgWaitByHour}
              xTickFormatter={(v) => v}
            />
            <ChartBarInteractiveMetric
              title={`Daily visitors (last ${rangeDays} days)`}
              data={analytics.compare.dailyVisitors}
              xTickFormatter={(v) => formatIfISODateLabel(v)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
