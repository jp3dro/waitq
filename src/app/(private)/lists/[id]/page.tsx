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

  // Compute ETA based on last 100 notified entries for this list
  const etaRes = await supabase
    .from("waitlist_entries")
    .select("created_at, notified_at")
    .eq("waitlist_id", waitlist.id)
    .not("notified_at", "is", null)
    .order("notified_at", { ascending: false })
    .limit(100);
  const etaRows = (etaRes.data || []) as { created_at: string; notified_at: string | null }[];
  const durationsMs = etaRows
    .map((r) => (r.notified_at ? new Date(r.notified_at).getTime() - new Date(r.created_at).getTime() : null))
    .filter((v): v is number => typeof v === "number" && isFinite(v) && v > 0);
  const avgMs = durationsMs.length ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length) : 0;
  const etaMin = avgMs ? Math.max(1, Math.round(avgMs / 60000)) : 0;

  return (
    <main className="py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{waitlist.name}</h1>
            <p className="mt-1 text-sm text-neutral-600">Estimated time: {etaMin ? `${etaMin} minutes` : '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            <EditListButton waitlistId={waitlist.id} initialName={waitlist.name} />
            <AddButton defaultWaitlistId={waitlist.id} lockWaitlist />
          </div>
        </div>

        <WaitlistTable fixedWaitlistId={waitlist.id} />
      </div>
    </main>
  );
}


