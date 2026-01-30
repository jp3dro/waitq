"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, ExternalLink } from "lucide-react";

import AddButton from "@/app/(private)/dashboard/waitlist-add-button";
import EditListButton from "./edit-list-button";
import ClearWaitlistButton from "./clear-waitlist-button";
import QRCodeButton from "./qr-code-button";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Country } from "react-phone-number-input";
import type { ListType } from "@/app/(private)/lists/list-form-fields";

type Location = { id: string; name: string };

export default function MobileListActions({
  waitlistId,
  waitlistName,
  locationId,
  kioskEnabled,
  kioskQrEnabled,
  displayEnabled,
  displayShowName,
  displayShowQr,
  askName,
  askPhone,
  askEmail,
  seatingPreferences,
  listType = "eat_in",
  displayToken,
  businessName,
  businessCountry,
  disabled,
  disabledReason,
  locations,
}: {
  waitlistId: string;
  waitlistName: string;
  locationId: string;
  kioskEnabled: boolean;
  kioskQrEnabled: boolean;
  displayEnabled: boolean;
  displayShowName: boolean;
  displayShowQr: boolean;
  askName: boolean;
  askPhone: boolean;
  askEmail: boolean;
  seatingPreferences: string[];
  listType?: ListType;
  displayToken?: string | null;
  businessName?: string;
  businessCountry: Country;
  disabled?: boolean;
  disabledReason?: string | null;
  locations: Location[];
}) {
  const [editOpen, setEditOpen] = useState(false);

  const canShowPublicDisplay = !!displayToken && displayEnabled !== false;
  const publicDisplayHref = displayToken ? `/display/${encodeURIComponent(displayToken)}` : null;

  return (
    <div className="md:hidden">
      <div className="flex items-stretch gap-2">
        <AddButton
          defaultWaitlistId={waitlistId}
          lockWaitlist
          businessCountry={businessCountry}
          disabled={disabled}
          disabledReason={disabledReason}
          wrapperClassName="flex-1"
          className="w-full justify-center text-lg py-6"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 w-12 px-0"
              aria-label="More actions"
              title="More actions"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit list
            </DropdownMenuItem>

            <ClearWaitlistButton waitlistId={waitlistId} displayToken={displayToken} variant="menu" />

            {canShowPublicDisplay && publicDisplayHref ? (
              <DropdownMenuItem asChild>
                <a href={publicDisplayHref} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Public display
                </a>
              </DropdownMenuItem>
            ) : null}

            {canShowPublicDisplay && kioskQrEnabled ? <QRCodeButton listName={waitlistName} displayToken={displayToken} businessName={businessName} variant="menu" /> : null}

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <a href="/lists">Back to lists</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hidden trigger; controlled open via menu */}
      <EditListButton
        waitlistId={waitlistId}
        initialName={waitlistName}
        initialLocationId={locationId}
        initialKioskEnabled={kioskEnabled}
        initialKioskQrEnabled={kioskQrEnabled}
        initialDisplayEnabled={displayEnabled}
        initialDisplayShowName={displayShowName}
        initialDisplayShowQr={displayShowQr}
        initialAskName={askName}
        initialAskPhone={askPhone}
        initialAskEmail={askEmail}
        initialSeatingPreferences={seatingPreferences}
        initialListType={listType}
        locations={locations}
        hideTrigger
        controlledOpen={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}

