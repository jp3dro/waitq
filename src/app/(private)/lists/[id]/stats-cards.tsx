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
  const supabase = createClient();

  const calculateStats = async () => {
    try {
      const [etaRes, lastCalledRes] = await Promise.all([
        supabase
          .from("waitlist_entries")
          .select("created_at, notified_at")
          .eq("waitlist_id", waitlistId)
          .not("notified_at", "is", null)
          .order("notified_at", { ascending: false })
          .limit(100),
        supabase
          .from("waitlist_entries")
          .select("ticket_number, queue_position, notified_at")
          .eq("waitlist_id", waitlistId)
          .eq("status", "notified")
          .order("notified_at", { ascending: false })
          .order("ticket_number", { ascending: false })
          .limit(1)
      ]);

      // Calculate ETA
      const etaRows = (etaRes.data || []) as { created_at: string; notified_at: string | null }[];
      const durationsMs = etaRows
        .map((r) => (r.notified_at ? new Date(r.notified_at).getTime() - new Date(r.created_at).getTime() : null))
        .filter((v): v is number => typeof v === "number" && isFinite(v) && v > 0);
      const avgMs = durationsMs.length ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length) : 0;
      const totalMin = avgMs ? Math.max(1, Math.round(avgMs / 60000)) : 0;
      const hours = Math.floor(totalMin / 60);
      const minutes = totalMin % 60;
      const newEtaDisplay = totalMin > 0 ? (hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`) : "";

      // Get last called number
      const lastCalledEntry = lastCalledRes.data?.[0] as { ticket_number: number | null; queue_position: number | null; notified_at: string | null } | undefined;
      const newLastCalledNumber = lastCalledEntry?.ticket_number ?? lastCalledEntry?.queue_position ?? null;

      setLastCalledNumber(newLastCalledNumber);
      setEtaDisplay(newEtaDisplay);
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white ring-1 ring-black/5 rounded-xl p-4">
        <p className="text-sm text-neutral-600">Now serving</p>
        <p className="mt-1 text-xl font-semibold">{lastCalledNumber ?? "—"}</p>
      </div>
          <div className="bg-white ring-1 ring-black/5 rounded-xl p-4">
            <p className="text-sm text-neutral-600">Estimated wait time</p>
            <p className="mt-1 text-xl font-semibold">{etaDisplay || "—"}</p>
          </div>
    </div>
  );
}
