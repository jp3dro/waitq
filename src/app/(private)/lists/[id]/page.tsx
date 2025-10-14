import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WaitlistTable from "@/app/(private)/dashboard/waitlist-table";
import ToastOnQuery from "@/components/toast-on-query";
import AddButton from "@/app/(private)/dashboard/waitlist-add-button";
import EditListButton from "./edit-list-button";
import StatsCards from "./stats-cards";
import ClearWaitlistButton from "./clear-waitlist-button";

type WaitlistRow = {
  id: string;
  name: string;
  kiosk_enabled: boolean | null;
  display_token: string | null;
  location_id: string | null;
  business_locations: { id: string; name: string } | null;
};

export default async function ListDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id: waitlistId } = await params;

  const { data: waitlist, error } = await supabase
    .from("waitlists")
    .select(`
      id,
      name,
      kiosk_enabled,
      display_token,
      location_id,
      business_locations (
        id,
        name
      )
    `)
    .eq("id", waitlistId)
    .single();
  if (error || !waitlist) redirect("/dashboard");
  const wl = waitlist as unknown as WaitlistRow;

  // Fetch all locations for the dropdown
  const { data: locations } = await supabase
    .from("business_locations")
    .select("id, name")
    .order("name");

  const typedLocations = locations?.map(loc => ({
    id: loc.id as string,
    name: loc.name as string
  })) || [];

  return (
    <main className="py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <ToastOnQuery />
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{wl.name}</h1>
            <p className="mt-1 text-sm text-neutral-600">Manage your waitlist entries</p>
          </div>
          <div className="flex items-center gap-2">
            <EditListButton
              waitlistId={wl.id}
              initialName={wl.name}
              initialLocationId={wl.location_id || wl.business_locations?.id}
              initialKioskEnabled={!!wl.kiosk_enabled}
              locations={typedLocations}
            />
            {wl.display_token && (
              <a
                href={`/display/${encodeURIComponent(wl.display_token)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50"
              >
                Open Public Display
              </a>
            )}
            <ClearWaitlistButton waitlistId={wl.id} displayToken={wl.display_token} />
            <AddButton defaultWaitlistId={wl.id} lockWaitlist />
          </div>
        </div>

        {/* Reactive stats cards */}
        <StatsCards waitlistId={wl.id} />

        <WaitlistTable fixedWaitlistId={wl.id} />
      </div>
    </main>
  );
}


