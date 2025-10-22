"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function WeeklyStats({ waitlistId }: { waitlistId: string }) {
  const [weeklyServed, setWeeklyServed] = useState<number>(0);
  const [busiestDay, setBusiestDay] = useState<string>("");
  const supabase = createClient();

  const calculateWeeklyStats = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekStr = oneWeekAgo.toISOString();

      const [weeklyRes, dailyBreakdownRes] = await Promise.all([
        // Total served this week
        supabase
          .from("waitlist_entries")
          .select("id", { count: "exact", head: true })
          .eq("waitlist_id", waitlistId)
          .in("status", ["notified", "seated"])
          .gte("notified_at", weekStr),
        // Daily breakdown for busiest day
        supabase
          .from("waitlist_entries")
          .select("notified_at")
          .eq("waitlist_id", waitlistId)
          .in("status", ["notified", "seated"])
          .gte("notified_at", weekStr)
      ]);

      const newWeeklyServed = weeklyRes.count || 0;
      setWeeklyServed(newWeeklyServed);

      // Calculate busiest day
      const dailyEntries = (dailyBreakdownRes.data || []) as { notified_at: string | null }[];
      const dayCounts: { [key: string]: number } = {};

      dailyEntries.forEach(entry => {
        if (entry.notified_at) {
          const date = new Date(entry.notified_at).toDateString();
          dayCounts[date] = (dayCounts[date] || 0) + 1;
        }
      });

      let maxCount = 0;
      let busiestDate = "";

      Object.entries(dayCounts).forEach(([date, count]) => {
        if (count > maxCount) {
          maxCount = count;
          busiestDate = date;
        }
      });

      if (busiestDate) {
        const dayName = new Date(busiestDate).toLocaleDateString('en-US', { weekday: 'long' });
        setBusiestDay(`${dayName} (${maxCount})`);
      } else {
        setBusiestDay("—");
      }
    } catch (error) {
      console.error("Error calculating weekly stats:", error);
    }
  };

  useEffect(() => {
    calculateWeeklyStats();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`weekly-stats-${waitlistId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waitlist_entries" },
        (payload: { new?: { waitlist_id?: string }, old?: { waitlist_id?: string } }) => {
          const affectedNew = payload.new?.waitlist_id;
          const affectedOld = payload.old?.waitlist_id;
          if (affectedNew === waitlistId || affectedOld === waitlistId) {
            // Only recalculate weekly stats less frequently since they don't change as often
            setTimeout(calculateWeeklyStats, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, waitlistId]);

  // Also react to local refresh events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { waitlistId?: string } | undefined;
      if (!detail || (detail.waitlistId && detail.waitlistId !== waitlistId)) return;
      setTimeout(calculateWeeklyStats, 5000);
    };
    window.addEventListener('wl:refresh', handler as EventListener);
    return () => window.removeEventListener('wl:refresh', handler as EventListener);
  }, [waitlistId]);

  return (
    <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-4">
      <h3 className="text-sm font-medium mb-3">This Week</h3>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Total served</p>
          <p className="text-lg font-semibold">{weeklyServed}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Busiest day</p>
          <p className="text-sm font-medium">{busiestDay}</p>
        </div>
      </div>
    </div>
  );
}
