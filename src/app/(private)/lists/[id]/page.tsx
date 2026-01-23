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
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getLocationOpenState, type RegularHours } from "@/lib/location-hours";
import { resolveCurrentBusinessId } from "@/lib/current-business";

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
  display_enabled?: boolean | null;
  display_show_name?: boolean | null;
  display_show_qr?: boolean | null;
  display_token: string | null;
  location_id: string | null;
  ask_name: boolean | null;
  ask_phone: boolean | null;
  ask_email?: boolean | null;
  seating_preferences: string[] | null;
  business_locations:
    | { id: string; name: string; regular_hours?: unknown; timezone?: string | null }
    | { id: string; name: string; regular_hours?: unknown; timezone?: string | null }[]
    | null;
};

export default async function ListDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const businessId = await resolveCurrentBusinessId(supabase as any, user.id);

  const { id: waitlistId } = await params;

  const baseSelect = `
      id,
      name,
      kiosk_enabled,
      display_enabled,
      display_show_name,
      display_show_qr,
      display_token,
      location_id,
      ask_name,
      ask_phone,
      ask_email,
      seating_preferences,
      business_locations (
        id,
        name,
        regular_hours,
        timezone
      )
    `;
  let waitlist = null as unknown as WaitlistRow | null;
  const { data: wlData, error } = await supabase
    .from("waitlists")
    .select(baseSelect)
    .eq("id", waitlistId)
    .single();
  if (error && error.message.toLowerCase().includes("column")) {
    const { data: fallback } = await supabase
      .from("waitlists")
      .select(`
        id,
        name,
        kiosk_enabled,
        display_token,
        location_id,
        ask_name,
        ask_phone,
        ask_email,
        seating_preferences,
        business_locations (
          id,
          name,
          regular_hours,
          timezone
        )
      `)
      .eq("id", waitlistId)
      .single();
    if (!fallback) redirect("/lists");
    const fb = fallback as unknown as Record<string, unknown>;
    const bl = fb["business_locations"] as unknown;
    const business_locations =
      Array.isArray(bl) ? ((bl[0] as any) ?? null) : (bl as any) ?? null;
    waitlist = {
      ...(fb as any),
      business_locations,
      display_enabled: true,
      display_show_name: false,
      display_show_qr: false,
    } as WaitlistRow;
  } else {
    if (error || !wlData) redirect("/lists");
    waitlist = wlData as WaitlistRow;
  }
  const wl = waitlist as WaitlistRow;

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
  const businessRow =
    businessId
      ? await supabase.from("businesses").select("name, country_code").eq("id", businessId).maybeSingle()
      : { data: null as any };
  const businessCountry = (((businessRow as any)?.data?.country_code as string | null) || "PT") as Country;
  const businessName = (((businessRow as any)?.data?.name as string | null) || undefined) as string | undefined;

  const locationIsOpen = (() => {
    const loc = Array.isArray(wl.business_locations) ? wl.business_locations[0] : wl.business_locations;
    if (!loc) return true;
    const st = getLocationOpenState({
      regularHours: (loc.regular_hours as RegularHours | null) || null,
      timezone: (typeof loc.timezone === "string" ? loc.timezone : null) || null,
    });
    return st.isOpen;
  })();
  const isLive = locationIsOpen;
  const liveHelp =
    "Live means this list is currently within this location’s working hours. You can change working hours in Locations → Edit location.";
  const locationName = (() => {
    const loc = Array.isArray(wl.business_locations) ? wl.business_locations[0] : wl.business_locations;
    const name = (loc as { name?: unknown } | null)?.name;
    return typeof name === "string" ? name : null;
  })();

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-8">
        <ToastOnQuery />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="icon-sm" className="shrink-0">
                <Link href="/lists" aria-label="Back to lists">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{wl.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
              {!locationIsOpen ? (
                <Badge variant="secondary" className="gap-1 bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/30">
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive"></span>
                  Closed
                </Badge>
              ) : isLive ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-800 cursor-help"
                    >
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      Live
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{liveHelp}</TooltipContent>
                </Tooltip>
              ) : null}
              </div>
            </div>
            
          </div>
        </div>

        <div className="text-card-foreground rounded-xl space-y-6">
          {/* Actions: mobile grid (xs/sm) */}
          <div className="md:hidden grid gap-2">
            <AddButton
              defaultWaitlistId={wl.id}
              lockWaitlist
              businessCountry={businessCountry}
              disabled={!locationIsOpen}
              disabledReason="Restaurant is closed"
              className="w-full justify-center"
            />
            <div className="grid grid-cols-2 gap-2">
              <EditListButton
                waitlistId={wl.id}
                initialName={wl.name}
                initialLocationId={
                  wl.location_id ||
                  (Array.isArray(wl.business_locations) ? wl.business_locations[0]?.id : wl.business_locations?.id)
                }
                initialKioskEnabled={!!wl.kiosk_enabled}
                initialDisplayEnabled={wl.display_enabled !== false}
                initialDisplayShowName={wl.display_show_name !== false}
                initialDisplayShowQr={wl.display_show_qr === true}
                initialAskName={wl.ask_name !== false}
                initialAskPhone={wl.ask_phone !== false}
                initialAskEmail={wl.ask_email === true}
                initialSeatingPreferences={wl.seating_preferences || []}
                locations={typedLocations}
                buttonClassName="w-full justify-center"
              />
              <ClearWaitlistButton
                waitlistId={wl.id}
                displayToken={wl.display_token}
                variant="button"
                className="w-full justify-center"
              />
              {wl.display_token && wl.display_enabled !== false ? (
                <>
                  <Button asChild variant="outline" size="sm" className="w-full justify-center">
                    <a
                      href={`/display/${encodeURIComponent(wl.display_token)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Public display
                    </a>
                  </Button>
                  <QRCodeButton
                    listName={wl.name}
                    displayToken={wl.display_token}
                    businessName={businessName}
                    variant="button"
                    className="w-full justify-center"
                  />
                </>
              ) : null}
            </div>
          </div>

          {/* Actions: desktop row (md+) */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AddButton
                defaultWaitlistId={wl.id}
                lockWaitlist
                businessCountry={businessCountry}
                disabled={!locationIsOpen}
                disabledReason="Restaurant is closed"
              />
              <EditListButton
                waitlistId={wl.id}
                initialName={wl.name}
                initialLocationId={
                  wl.location_id ||
                  (Array.isArray(wl.business_locations) ? wl.business_locations[0]?.id : wl.business_locations?.id)
                }
                initialKioskEnabled={!!wl.kiosk_enabled}
                initialDisplayEnabled={wl.display_enabled !== false}
                initialDisplayShowName={wl.display_show_name !== false}
                initialDisplayShowQr={wl.display_show_qr === true}
                initialAskName={wl.ask_name !== false}
                initialAskPhone={wl.ask_phone !== false}
                initialAskEmail={wl.ask_email === true}
                initialSeatingPreferences={wl.seating_preferences || []}
                locations={typedLocations}
              />
              {wl.display_token && wl.display_enabled !== false && (
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


