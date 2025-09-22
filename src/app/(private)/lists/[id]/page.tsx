import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WaitlistTable from "@/app/(private)/dashboard/waitlist-table";
import AddButton from "@/app/(private)/dashboard/waitlist-add-button";
import EditListButton from "./edit-list-button";

export default async function ListDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id: waitlistId } = await params;

  const { data: waitlist, error } = await supabase
    .from("waitlists")
    .select("id, name, display_token")
    .eq("id", waitlistId)
    .single();
  if (error || !waitlist) redirect("/dashboard");

  // Get data for ETA calculation and last called number
  const [etaRes, lastCalledRes] = await Promise.all([
    supabase
      .from("waitlist_entries")
      .select("created_at, notified_at")
      .eq("waitlist_id", waitlist.id)
      .not("notified_at", "is", null)
      .order("notified_at", { ascending: false })
      .limit(100),
    supabase
      .from("waitlist_entries")
      .select("ticket_number, queue_position, notified_at")
      .eq("waitlist_id", waitlist.id)
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
  const etaMin = avgMs ? Math.max(1, Math.round(avgMs / 60000)) : 0;

  // Get last called number
  const lastCalledEntry = lastCalledRes.data?.[0] as { ticket_number: number | null; queue_position: number | null; notified_at: string | null } | undefined;
  const lastCalledNumber = lastCalledEntry?.ticket_number ?? lastCalledEntry?.queue_position ?? null;

  return (
    <main className="py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{waitlist.name}</h1>
            <p className="mt-1 text-sm text-neutral-600">Manage your waitlist entries</p>
          </div>
          <div className="flex items-center gap-2">
            <EditListButton waitlistId={waitlist.id} initialName={waitlist.name} />
            {waitlist.display_token && (
              <a
                href={`/display/${encodeURIComponent(waitlist.display_token)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50"
              >
                Open Public Display
              </a>
            )}
            <AddButton defaultWaitlistId={waitlist.id} lockWaitlist />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-6">
            <p className="text-sm text-neutral-600">Now serving</p>
            <p className="mt-2 text-3xl font-semibold">{lastCalledNumber ?? "—"}</p>
          </div>
          <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-6">
            <p className="text-sm text-neutral-600">Estimated wait time</p>
            <p className="mt-2 text-3xl font-semibold">{etaMin ? `${etaMin}m` : "—"}</p>
          </div>
        </div>

        <WaitlistTable fixedWaitlistId={waitlist.id} />
      </div>
    </main>
  );
}


