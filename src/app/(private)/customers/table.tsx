"use client";
import { useEffect, useMemo, useState } from "react";
import { differenceInMinutes } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { SeatingPreferenceBadge } from "@/components/ui/seating-preference-badge";
import { Crown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VisitDetailModal from "@/components/visit-detail-modal";
import UpgradeRequiredDialog from "@/components/upgrade-required-dialog";
import { HoverClickTooltip } from "@/components/ui/hover-click-tooltip";
import { useTimeFormat } from "@/components/time-format-provider";
import { formatDateTime } from "@/lib/date-time";
import type { PlanId } from "@/lib/plans";

type Location = {
  id: string;
  name: string;
};

type Waitlist = {
  id: string;
  name: string;
  location_id: string | null;
  list_type?: "eat_in" | "take_out" | null;
  seating_preferences?: string[] | null;
  ask_name?: boolean | null;
  ask_phone?: boolean | null;
  ask_email?: boolean | null;
};

type VisitEntry = {
  id: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  party_size: number | null;
  seating_preference: string | null;
  visits_count?: number | null;
  is_returning?: boolean | null;
  status: string;
  created_at: string;
  notified_at: string | null;
  cancelled_at: string | null;
  waitlist_id: string | null;
};

function getWaitTime(createdAt: string, notifiedAt: string | null) {
  const start = new Date(createdAt);
  const end = notifiedAt ? new Date(notifiedAt) : new Date();
  const totalMinutes = differenceInMinutes(end, start);

  if (totalMinutes < 1) return "< 1m";

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getStatusBadge(status: string, notifiedAt: string | null) {
  if (status === "seated") {
    return <Badge className="bg-emerald-500 dark:bg-emerald-600 text-white">Showed</Badge>;
  }
  if (status === "cancelled") {
    return <Badge className="bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground">Cancelled</Badge>;
  }
  if (status === "archived") {
    // If notified but archived, it's a no-show
    if (notifiedAt) {
      return <Badge className="bg-red-500 dark:bg-red-600 text-white">No show</Badge>;
    }
    return <Badge className="bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground">Archived</Badge>;
  }
  if (status === "notified") {
    return <Badge className="bg-blue-500 dark:bg-blue-600 text-white">Called</Badge>;
  }
  return <Badge className="bg-yellow-500 dark:bg-yellow-600 text-white dark:text-black">Waiting</Badge>;
}

export default function CustomersTable({
  businessId,
  locations,
  waitlists,
}: {
  businessId: string;
  locations: Location[];
  waitlists: Waitlist[];
}) {
  const timeFormat = useTimeFormat();
  const [visits, setVisits] = useState<VisitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationId, setLocationId] = useState<string>("all");
  const [waitlistId, setWaitlistId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"today" | "yesterday" | "7" | "15" | "30" | "90">("today");
  const [selectedVisit, setSelectedVisit] = useState<VisitEntry | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [planId, setPlanId] = useState<PlanId>("free");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const pageSize = 50;
  const selectedWaitlist = useMemo(() => {
    if (!selectedVisit?.waitlist_id) return null;
    return waitlists.find((w) => w.id === selectedVisit.waitlist_id) || null;
  }, [selectedVisit?.waitlist_id, waitlists]);
  const loyaltyTooltip = (visit: VisitEntry) => {
    const total = typeof visit.visits_count === "number" ? visit.visits_count : null;
    const prior = total !== null ? Math.max(0, total - 1) : null;
    return (
      <div className="space-y-1">
        <div className="font-medium">Loyalty user</div>
        <div className="text-xs opacity-90">
          Returning visitor{prior !== null ? ` • ${prior} prior check-in${prior === 1 ? "" : "s"}` : ""}
        </div>
      </div>
    );
  };

  useEffect(() => {
    async function fetchVisits() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          locationId,
          waitlistId,
          dateRange,
          page: String(page),
          pageSize: String(pageSize),
        });
        const res = await fetch(`/api/customer-visits?${params.toString()}`, { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setVisits([]);
          setTotalCount(0);
        } else {
          setVisits((j.visits || []) as VisitEntry[]);
          setTotalCount(typeof j.count === "number" ? j.count : 0);
        }
      } catch {
        setVisits([]);
        setTotalCount(0);
      }
      setLoading(false);
    }

    fetchVisits();
  }, [businessId, locationId, waitlistId, dateRange, page]);

  const filteredWaitlists = useMemo(() => {
    if (locationId === "all") return waitlists;
    return waitlists.filter(w => w.location_id === locationId);
  }, [locationId, waitlists]);

  // Reset waitlist filter when location changes
  useEffect(() => {
    if (locationId !== "all" && waitlistId !== "all") {
      const waitlistExists = filteredWaitlists.some(w => w.id === waitlistId);
      if (!waitlistExists) {
        setWaitlistId("all");
      }
    }
  }, [locationId, waitlistId, filteredWaitlists]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [locationId, waitlistId, dateRange]);

  // Fetch plan info
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/plan", { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        if (res.ok && typeof j?.planId === "string") {
          setPlanId(j.planId as PlanId);
        }
      } catch { }
    })();
  }, []);

  return (
    <div className="space-y-4">
      {/* Filters - always visible */}
      <div className="flex flex-wrap items-center gap-4">
        <Tabs
          value={dateRange}
          onValueChange={(v) => {
            const next = v as typeof dateRange;
            if (planId !== "premium" && next === "90") {
              setUpgradeOpen(true);
              return;
            }
            setDateRange(next);
          }}
        >
          <TabsList variant="default">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
            <TabsTrigger value="7">Last 7 days</TabsTrigger>
            <TabsTrigger value="15">Last 15 days</TabsTrigger>
            <TabsTrigger value="30">Last 30 days</TabsTrigger>
            <TabsTrigger value="90">Last 90 days</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select
          value={locationId}
          onValueChange={(v) => {
            setLocationId(v);
            setWaitlistId("all");
          }}
        >
          <SelectTrigger className="w-[180px]">
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

        <Select value={waitlistId} onValueChange={setWaitlistId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Waitlist" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All lists</SelectItem>
            {filteredWaitlists.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl overflow-hidden w-full">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="text-left font-medium text-foreground px-4 py-2">Customer</th>
                  <th className="text-left font-medium text-foreground px-4 py-2">Preferences</th>
                  <th className="text-left font-medium text-foreground px-4 py-2">Party</th>
                  <th className="text-left font-medium text-foreground px-4 py-2">Wait time</th>
                  <th className="text-left font-medium text-foreground px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                      <p className="text-sm text-muted-foreground">Loading visits...</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : visits.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="text-base font-semibold">No visits found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No customer visits in the selected period.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="text-left font-medium text-foreground px-4 py-2">Customer</th>
                  <th className="text-left font-medium text-foreground px-4 py-2">Preferences</th>
                  <th className="text-left font-medium text-foreground px-4 py-2">Party</th>
                  <th className="text-left font-medium text-foreground px-4 py-2">Wait time</th>
                  <th className="text-left font-medium text-foreground px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit) => (
                  <tr
                    key={visit.id}
                    className="border-t border-border hover:bg-muted odd:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedVisit(visit)}
                  >
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium inline-flex items-center gap-2">
                          <span>{visit.customer_name || "—"}</span>
                          {visit.is_returning ? (
                            <HoverClickTooltip content={loyaltyTooltip(visit)} side="bottom" align="start">
                              <button
                                type="button"
                                className="inline-flex items-center"
                                aria-label="Loyalty user"
                                title="Loyalty user"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Crown className="h-4 w-4 text-orange-500" />
                              </button>
                            </HoverClickTooltip>
                          ) : null}
                        </span>
                        {visit.phone && (
                          <span className="text-xs text-muted-foreground">{visit.phone}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {visit.seating_preference ? (
                        <SeatingPreferenceBadge>{visit.seating_preference}</SeatingPreferenceBadge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">{visit.party_size || "—"}</td>
                    <td className="px-4 py-2">
                      {getWaitTime(visit.created_at, visit.notified_at)}
                    </td>
                    <td className="px-4 py-2">
                      {getStatusBadge(visit.status, visit.notified_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer: count + pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {(() => {
            const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
            const end = Math.min(totalCount, page * pageSize);
            return (
              <>
                Showing <span className="font-medium text-foreground tabular-nums">{start}-{end}</span>{" "}
                of <span className="font-medium text-foreground tabular-nums">{totalCount}</span>
              </>
            );
          })()}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center rounded-md px-3 py-1.5 text-sm ring-1 ring-inset ring-border hover:bg-muted disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {page} / {Math.max(1, Math.ceil(totalCount / pageSize))}
          </span>
          <button
            type="button"
            className="inline-flex items-center rounded-md px-3 py-1.5 text-sm ring-1 ring-inset ring-border hover:bg-muted disabled:opacity-50"
            disabled={page >= Math.max(1, Math.ceil(totalCount / pageSize))}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Visit Detail Modal */}
      <VisitDetailModal
        visit={selectedVisit}
        open={!!selectedVisit}
        onOpenChange={(open) => !open && setSelectedVisit(null)}
        listType={(selectedWaitlist?.list_type === "take_out" || selectedWaitlist?.list_type === "eat_in") ? selectedWaitlist.list_type : "eat_in"}
        seatingPreferences={Array.isArray(selectedWaitlist?.seating_preferences) ? selectedWaitlist!.seating_preferences! : []}
        askName={selectedWaitlist?.ask_name !== false}
        askPhone={selectedWaitlist?.ask_phone !== false}
        askEmail={selectedWaitlist?.ask_email === true}
      />

      {/* Upgrade required dialog for 90 days */}
      <UpgradeRequiredDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        title="Upgrade to unlock 90-day history"
        description="Your current plan includes visits history up to 30 days. Upgrade to Premium to view visits up to 90 days."
        ctaLabel="View plans"
        ctaHref="/subscriptions"
      />
    </div>
  );
}
