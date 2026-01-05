import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import WaitlistTable from "@/app/(private)/dashboard/waitlist-table";
import ToastOnQuery from "@/components/toast-on-query";
import AddButton from "@/app/(private)/dashboard/waitlist-add-button";
import EditListButton from "./edit-list-button";
import StatsCards from "./stats-cards";
import ClearWaitlistButton from "./clear-waitlist-button";
import QRCodeButton from "./qr-code-button";
import type { Country } from "react-phone-number-input";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const supabase = await createClient();
  const { id: waitlistId } = await params;

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("name")
    .eq("id", waitlistId)
    .single();

  return {
    title: waitlist?.name || "List Details",
  };
}

type WaitlistRow = {
  id: string;
  name: string;
  kiosk_enabled: boolean | null;
  display_token: string | null;
  location_id: string | null;
  ask_name: boolean | null;
  ask_phone: boolean | null;
  seating_preferences: string[] | null;
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
      ask_name,
      ask_phone,
      seating_preferences,
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

  // Fetch business data for phone input default and QR code
  const { data: business } = await supabase
    .from("businesses")
    .select("name, country_code")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const businessCountry = (business?.country_code || "PT") as Country;
  const businessName = business?.name;

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <ToastOnQuery />
        <div className="flex items-center gap-6">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/lists">
              <ArrowLeft className="h-4 w-4" />
              Back to Lists
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{wl.name}</h1>
        </div>

        <div className="bg-card text-card-foreground rounded-xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AddButton defaultWaitlistId={wl.id} lockWaitlist businessCountry={businessCountry} />
              <EditListButton
                waitlistId={wl.id}
                initialName={wl.name}
                initialLocationId={wl.location_id || wl.business_locations?.id}
                initialKioskEnabled={!!wl.kiosk_enabled}
                initialAskName={wl.ask_name !== false}
                initialAskPhone={wl.ask_phone !== false}
                initialSeatingPreferences={wl.seating_preferences || []}
                locations={typedLocations}
              />
              {wl.display_token && (
                <>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`/display/${encodeURIComponent(wl.display_token)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Public Display
                    </a>
                  </Button>
                  <QRCodeButton listName={wl.name} displayToken={wl.display_token} businessName={businessName} />
                </>
              )}
              <ClearWaitlistButton waitlistId={wl.id} displayToken={wl.display_token} variant="button" className="h-8" />
            </div>
          </div>

          <div>
            {/* Reactive stats cards */}
            <StatsCards waitlistId={wl.id} />
          </div>

          <WaitlistTable fixedWaitlistId={wl.id} />
        </div>
      </div>
    </main>
  );
}


