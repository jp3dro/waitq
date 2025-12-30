"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ChangePayload = {
  new?: { waitlist_id?: string } | Record<string, unknown>;
  old?: { waitlist_id?: string } | Record<string, unknown>;
};

export default function StatsCards({ waitlistId }: { waitlistId: string }) {
  const [lastCalledNumber, setLastCalledNumber] = useState<number | null>(null);
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
          .select("ticket_number, queue_position, notified_at")
          .eq("waitlist_id", waitlistId)
          .in("status", ["notified", "seated"]) 
          .not("notified_at", "is", null)
          .order("notified_at", { ascending: false })
          .order("ticket_number", { ascending: false })
          .limit(1),
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
      const newEtaDisplay = totalMin > 0 ? (hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`) : "";

      // Get last called number
      const lastCalledEntry = lastCalledRes.data?.[0] as { ticket_number: number | null; queue_position: number | null; notified_at: string | null } | undefined;
      const newLastCalledNumber = lastCalledEntry?.ticket_number ?? lastCalledEntry?.queue_position ?? null;

      // Queue length
      const newQueueLength = queueRes.count || 0;

      // Served and no show today
      const newServedToday = servedTodayRes.count || 0;
      const newNoShowToday = noShowTodayRes.count || 0;


      setLastCalledNumber(newLastCalledNumber);
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <div className="bg-primary/10 text-card-foreground ring-1 ring-primary rounded-xl p-3">
        <p className="text-xs font-medium text-primary">Now serving</p>
        <p className="mt-0.5 text-xl font-bold text-foreground">{lastCalledNumber ?? "—"}</p>
      </div>
      <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-3">
        <p className="text-xs text-muted-foreground">Estimated wait time</p>
        <p className="mt-0.5 text-lg font-semibold">{etaDisplay || "—"}</p>
      </div>
      <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-3">
        <p className="text-xs text-muted-foreground">People waiting</p>
        <p className="mt-0.5 text-lg font-semibold">{queueLength}</p>
      </div>
      <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-3">
        <p className="text-xs text-muted-foreground">Served today</p>
        <p className="mt-0.5 text-lg font-semibold">{servedToday}</p>
      </div>
      <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-3">
        <p className="text-xs text-muted-foreground">No show today</p>
        <p className="mt-0.5 text-lg font-semibold">{noShowToday}</p>
      </div>
      {/* Avg service time removed */}
    </div>
  );
}
