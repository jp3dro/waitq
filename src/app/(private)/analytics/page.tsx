"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

function SimpleLineChart({ data, height = 180, color = "var(--primary)", valueFormatter = (v: number) => v.toString() }: { data: { label: string; value: number }[]; height?: number; color?: string; valueFormatter?: (v: number) => string }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const max = Math.max(1, ...data.map(d => d.value));
  const width = 640; // virtual width; responsive via viewBox
  const hPad = 48; // more space for y-axis labels
  const vPad = 28; // more space for x-axis labels
  const innerW = width - hPad * 2;
  const innerH = height - vPad * 2;
  const pts = data.map((d, i) => {
    const x = hPad + (innerW * (data.length <= 1 ? 0 : i / (data.length - 1)));
    const y = vPad + innerH - (innerH * (d.value / max));
    return { x, y };
  });
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  // Y-axis tick values (0%, 25%, 50%, 75%, 100%)
  const yTickValues = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(max * f));
  // X-axis tick indices (up to 6 labels)
  const xTickCount = Math.min(6, Math.max(2, data.length));
  const xTickIdxs: number[] = [];
  if (data.length <= xTickCount) {
    for (let i = 0; i < data.length; i++) xTickIdxs.push(i);
  } else {
    const step = (data.length - 1) / (xTickCount - 1);
    for (let i = 0; i < xTickCount; i++) xTickIdxs.push(Math.round(i * step));
  }
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
        {/* grid lines */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={hPad} x2={width - hPad} y1={vPad + innerH * g} y2={vPad + innerH * g} stroke="var(--border)" strokeDasharray="4 4" />
        ))}
        {/* axes */}
        <line x1={hPad} x2={hPad} y1={vPad} y2={vPad + innerH} stroke="var(--ring)" strokeWidth={1} />
        <line x1={hPad} x2={width - hPad} y1={vPad + innerH} y2={vPad + innerH} stroke="var(--ring)" strokeWidth={1} />
        {/* y-axis labels */}
        {yTickValues.map((val, i) => {
          const y = vPad + innerH - (innerH * (val / max));
          return (
            <g key={`yt-${i}`}>
              <text x={hPad - 8} y={y} textAnchor="end" alignmentBaseline="middle" fontSize={12} fill="var(--muted-foreground)">{val}</text>
            </g>
          );
        })}
        {/* x-axis labels */}
        {xTickIdxs.map((idx) => {
          const x = hPad + (innerW * (data.length <= 1 ? 0 : idx / (data.length - 1)));
          return (
            <text key={`xt-${idx}`} x={x} y={vPad + innerH + 16} textAnchor="middle" fontSize={12} fill="var(--muted-foreground)">{data[idx]?.label}</text>
          );
        })}
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={`pt-${i}`}>
            <circle cx={p.x} cy={p.y} r={3} fill={color} />
          </g>
        ))}
        {/* hover overlay for smooth tooltip */}
        <rect
          x={hPad}
          y={vPad}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseMove={(e) => {
            const rect = (e.target as SVGRectElement).ownerSVGElement!.getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const svgX = (relX / rect.width) * width;
            const xNorm = Math.min(1, Math.max(0, (svgX - hPad) / innerW));
            const idx = Math.round(xNorm * (data.length - 1));
            if (isFinite(idx) && idx >= 0 && idx < data.length) {
              setHoverIdx(idx);
              const px = pts[idx].x;
              const py = pts[idx].y;
              setTooltip({ x: (px / width) * rect.width, y: (py / height) * rect.height, label: data[idx].label, value: data[idx].value });
            }
          }}
          onMouseLeave={() => { setHoverIdx(null); setTooltip(null); }}
        />
        {hoverIdx !== null && (
          <line x1={pts[hoverIdx].x} x2={pts[hoverIdx].x} y1={vPad} y2={vPad + innerH} stroke="var(--ring)" strokeDasharray="2 2" />
        )}
      </svg>
      {tooltip && (
        <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-3 rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow ring-1 ring-border" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="font-medium">{tooltip.label}</div>
          <div>{valueFormatter(tooltip.value)}</div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState<7 | 15 | 30>(7);
  const supabase = createClient();

  useEffect(() => {
    loadAnalytics(rangeDays);
  }, [rangeDays]);

  const loadAnalytics = async (days: 7 | 15 | 30) => {
    try {
      setLoading(true);

      // Date range
      const now = new Date();
      const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const [createdRowsRes, servedRowsRes] = await Promise.all([
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
      ]);

      const createdRows = createdRowsRes.data || [];
      const servedRows = servedRowsRes.data || [];

      // Total visitors
      const totalVisitors = createdRows.length;

      // Daily visitors series for the range
      const dayCounts = new Map<string, number>();
      for (let d = 0; d < days; d++) {
        const dt = new Date(now.getTime() - (days - 1 - d) * 86400000);
        const key = dt.toISOString().slice(0, 10);
        dayCounts.set(key, 0);
      }
      createdRows.forEach((r: any) => {
        const key = new Date(r.created_at).toISOString().slice(0, 10);
        if (dayCounts.has(key)) dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
      });
      const dailyVisitors = Array.from(dayCounts.entries()).map(([date, count]) => ({ date, count }));

      // Daily average
      const dailyAvg = days > 0 ? Math.round(totalVisitors / days) : 0;

      // Average hourly visits (per hour across days)
      const hourlyTotals: Record<number, number> = {};
      createdRows.forEach((r: any) => {
        const h = new Date(r.created_at).getHours();
        hourlyTotals[h] = (hourlyTotals[h] || 0) + 1;
      });
      const avgHourlyVisits = Array.from({ length: 24 }).map((_, h) => ({ hour: h, avg: +( (hourlyTotals[h] || 0) / days ).toFixed(2) }));

      // Average visitors by day of week (0=Sun..6=Sat)
      const weekdayTotals: Record<number, number> = {};
      const weekdayOccurrences: Record<number, number> = {};
      // Count how many times each weekday occurs in the selected range
      for (let d = 0; d < days; d++) {
        const dt = new Date(now.getTime() - d * 86400000);
        weekdayOccurrences[dt.getDay()] = (weekdayOccurrences[dt.getDay()] || 0) + 1;
      }
      createdRows.forEach((r: any) => {
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
        .map((r: any) => new Date(r.notified_at!).getTime() - new Date(r.created_at).getTime())
        .filter((ms: number) => ms > 0 && ms < 24 * 60 * 60 * 1000);
      const avgWaitTimeMin = waitDiffs.length ? Math.round(waitDiffs.reduce((a, b) => a + b, 0) / waitDiffs.length / 60000) : 0;

      // Approximate service time: average gap between consecutive notified_at (throughput)
      const notifiedTimes = servedRows
        .map((r: any) => new Date(r.notified_at!).getTime())
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
      servedRows.forEach((r: any) => {
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

    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <div className="inline-flex overflow-hidden rounded-md ring-1 ring-inset ring-border bg-card shadow-sm divide-x divide-border">
            {[7, 15, 30].map((d) => (
              <button
                key={d}
                onClick={() => setRangeDays(d as 7 | 15 | 30)}
                type="button"
                className={`action-btn ${rangeDays === d ? 'action-btn--primary' : ''}`}
              >
                Last {d} days
              </button>
            ))}
          </div>
        </div>

        {/* Analytics content container */}
        <div className="space-y-6">
          

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Total visitors</p>
              <p className="mt-1 text-xl font-semibold">{analytics.totalVisitors.toLocaleString()}</p>
            </div>
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Daily average</p>
              <p className="mt-1 text-xl font-semibold">{analytics.dailyAvg}</p>
            </div>
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Avg wait time</p>
              <p className="mt-1 text-xl font-semibold">{(() => { const m = analytics.avgWaitTimeMin; const h = Math.floor(m/60); const mm = m % 60; return h > 0 ? `${h}h ${mm}m` : `${mm}m`; })()}</p>
            </div>
            <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Avg service time</p>
              <p className="mt-1 text-xl font-semibold">{(() => { const m = analytics.avgServiceTimeMin; const h = Math.floor(m/60); const mm = m % 60; return h > 0 ? `${h}h ${mm}m` : `${mm}m`; })()}</p>
            </div>
          </div>

          {/* Daily visitors removed here to avoid duplication; see 2x2 grid below */}

          {/* Charts 2x2 grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card text-card-foreground rounded-xl p-6 ring-1 ring-border">
              <h3 className="text-lg font-semibold mb-4">Average hourly visits</h3>
              <SimpleLineChart
                data={analytics.avgHourlyVisits.map(h => ({ label: `${h.hour.toString().padStart(2,'0')}:00`, value: h.avg }))}
                valueFormatter={(v) => `${v} / hr`}
              />
            </div>
            <div className="bg-card text-card-foreground rounded-xl p-6 ring-1 ring-border">
              <h3 className="text-lg font-semibold mb-4">Average visitors by day of week</h3>
              <SimpleLineChart
                data={analytics.avgByWeekday.map(w => ({ label: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][w.weekday], value: w.avg }))}
                valueFormatter={(v) => `${v} / day`}
              />
            </div>
            <div className="bg-card text-card-foreground rounded-xl p-6 ring-1 ring-border">
              <h3 className="text-lg font-semibold mb-4">Average wait time by time of day</h3>
              <SimpleLineChart
                data={analytics.avgWaitByHour.map(h => ({ label: `${h.hour.toString().padStart(2,'0')}:00`, value: h.avgMin }))}
                valueFormatter={(v) => `${v} min`}
                />
            </div>
            <div className="bg-card text-card-foreground rounded-xl p-6 ring-1 ring-border">
              <h3 className="text-lg font-semibold mb-4">Daily visitors (last {rangeDays} days)</h3>
              <SimpleLineChart
                data={analytics.dailyVisitors.map(d => ({ label: new Date(d.date).toLocaleDateString(), value: d.count }))}
                valueFormatter={(v) => `${v} visitors`}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
