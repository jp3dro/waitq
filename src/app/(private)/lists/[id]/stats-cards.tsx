"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ChangePayload = {
  new?: { waitlist_id?: string } | Record<string, unknown>;
  old?: { waitlist_id?: string } | Record<string, unknown>;
};

export default function StatsCards({ waitlistId }: { waitlistId: string }) {
  const [servingNumbers, setServingNumbers] = useState<string>("");
  const [etaDisplay, setEtaDisplay] = useState<string>("");
  const [queueLength, setQueueLength] = useState<number>(0);
  const [servedToday, setServedToday] = useState<number>(0);
  const [noShowToday, setNoShowToday] = useState<number>(0);
  // Removed avg service time per requirements
  const supabase = createClient();

  const calculateStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      const [
        etaRes,
        lastCalledRes,
        queueRes,
        servedTodayRes,
        noShowTodayRes
      ] = await Promise.all([
        // ETA calculation: base on served (seated) entries only
        supabase
          .from("waitlist_entries")
          .select("created_at, notified_at")
          .eq("waitlist_id", waitlistId)
          .eq("status", "seated")
          .not("notified_at", "is", null)
          .order("notified_at", { ascending: false })
          .limit(100),
        // Last called number: any entry that has been notified (called), regardless of current status
        supabase
          .from("waitlist_entries")
          .select("ticket_number, queue_position, notified_at, status")
          .eq("waitlist_id", waitlistId)
          .in("status", ["notified", "seated"])
          .not("notified_at", "is", null)
          .order("notified_at", { ascending: false })
          .limit(100),
        // Queue length (waiting entries only, exclude archived)
        supabase
          .from("waitlist_entries")
          .select("id", { count: "exact", head: true })
          .eq("waitlist_id", waitlistId)
          .eq("status", "waiting"),
        // Served today (seated entries today)
        supabase
          .from("waitlist_entries")
          .select("id", { count: "exact", head: true })
          .eq("waitlist_id", waitlistId)
          .eq("status", "seated")
          .gte("notified_at", todayStr),
        // No show today (archived after being called today)
        supabase
          .from("waitlist_entries")
          .select("id", { count: "exact", head: true })
          .eq("waitlist_id", waitlistId)
          .eq("status", "archived")
          .gte("notified_at", todayStr),
      ]);

      // Calculate ETA
      const etaRows = (etaRes.data || []) as { created_at: string; notified_at: string | null }[];
      const durationsMs = etaRows
        .map((r) => (r.notified_at ? new Date(r.notified_at).getTime() - new Date(r.created_at).getTime() : null))
        .filter((v): v is number => typeof v === "number" && isFinite(v) && v > 0);
      const avgMs = durationsMs.length ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length) : 0;
      // Apply 5-minute minimum when queue is empty
      const queueCount = queueRes.count || 0;
      const baseMin = avgMs ? Math.max(1, Math.round(avgMs / 60000)) : 0;
      const totalMin = queueCount === 0 ? 5 : baseMin;
      const hours = Math.floor(totalMin / 60);
      const minutes = totalMin % 60;
      const newEtaDisplay = totalMin > 0 ? (hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`) : "0m";

      // Get serving numbers
      const entries = (lastCalledRes.data || []) as { ticket_number: number | null; queue_position: number | null; status: string }[];
      let serving = entries.filter(e => e.status === 'notified');

      let newServingNumbers = "";
      if (serving.length > 0) {
        // Sort ascendingly by number for display
        newServingNumbers = serving
          .map(e => ({ val: e.ticket_number ?? e.queue_position, original: e }))
          .filter(e => e.val !== null)
          .sort((a, b) => (a.val as number) - (b.val as number))
          .map(e => e.val)
          .join(", ");
      } else if (entries.length > 0) {
        // Fallback to the latest seated (index 0 is latest due to query sort)
        const latest = entries[0];
        const val = latest.ticket_number ?? latest.queue_position;
        newServingNumbers = val !== null ? String(val) : "";
      }

      // Queue length
      const newQueueLength = queueRes.count || 0;

      // Served and no show today
      const newServedToday = servedTodayRes.count || 0;
      const newNoShowToday = noShowTodayRes.count || 0;


      setServingNumbers(newServingNumbers);
      setEtaDisplay(newEtaDisplay);
      setQueueLength(newQueueLength);
      setServedToday(newServedToday);
      setNoShowToday(newNoShowToday);
      // avg service time removed
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  };

  useEffect(() => {
    calculateStats();

    // Subscribe to realtime changes (reuse same channel name as table)
    const channel = supabase
      .channel(`waitlist-entries-${waitlistId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waitlist_entries" },
        (payload: ChangePayload) => {
          const affectedNew = (payload.new as { waitlist_id?: string } | undefined)?.waitlist_id;
          const affectedOld = (payload.old as { waitlist_id?: string } | undefined)?.waitlist_id;
          if (affectedNew === waitlistId || affectedOld === waitlistId) {
            calculateStats();
          }
        }
      )
      .on("broadcast", { event: "refresh" }, () => {
        calculateStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, waitlistId]);

  // Also react to local refresh events triggered by forms/actions
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { waitlistId?: string } | undefined;
      if (!detail || (detail.waitlistId && detail.waitlistId !== waitlistId)) return;
      calculateStats();
    };
    window.addEventListener('wl:refresh', handler as EventListener);
    return () => window.removeEventListener('wl:refresh', handler as EventListener);
  }, [waitlistId]);

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
      <div className="sm:col-span-1 bg-primary/10 text-card-foreground ring-1 ring-border rounded-xl p-2 sm:p-3">
        <p className="text-[11px] sm:text-xs font-medium text-primary">Last called</p>
        <p className="mt-0.5 text-lg sm:text-xl font-bold text-foreground">{servingNumbers || "—"}</p>
      </div>
      <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-2 sm:p-3">
        <p className="text-[11px] sm:text-xs text-muted-foreground">Waiting time</p>
        <p className="mt-0.5 text-base sm:text-lg font-semibold">{etaDisplay || "—"}</p>
      </div>
      <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-2 sm:p-3">
        <p className="text-[11px] sm:text-xs text-muted-foreground">Waiting queue</p>
        <p className="mt-0.5 text-base sm:text-lg font-semibold">{queueLength}</p>
      </div>
      <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-2 sm:p-3">
        <p className="text-[11px] sm:text-xs text-muted-foreground">Served today</p>
        <p className="mt-0.5 text-base sm:text-lg font-semibold">{servedToday}</p>
      </div>
      <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-2 sm:p-3">
        <p className="text-[11px] sm:text-xs text-muted-foreground">No show</p>
        <p className="mt-0.5 text-base sm:text-lg font-semibold">{noShowToday}</p>
      </div>
      {/* Avg service time removed */}
    </div>
  );
}
