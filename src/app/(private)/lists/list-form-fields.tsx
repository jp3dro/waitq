"use client";
import { useId } from "react";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { HoverClickTooltip } from "@/components/ui/hover-click-tooltip";

type Location = { id: string; name: string };
const MAX_LIST_NAME_LEN = 30;

export type ListType = "eat_in" | "take_out";

type ListFormFieldsProps = {
  name: string;
  onNameChange: (v: string) => void;
  nameError?: string | null;
  locationId: string;
  onLocationChange: (v: string) => void;
  locations: Location[];
  isPending?: boolean;
  askName: boolean;
  onAskNameChange: (v: boolean) => void;
  askPhone: boolean;
  onAskPhoneChange: (v: boolean) => void;
  askEmail: boolean;
  onAskEmailChange: (v: boolean) => void;
  displayEnabled: boolean;
  onDisplayEnabledChange: (v: boolean) => void;
  displayShowName: boolean;
  onDisplayShowNameChange: (v: boolean) => void;
  kioskQrEnabled: boolean;
  onKioskQrEnabledChange: (v: boolean) => void;
  displayShowQr: boolean;
  onDisplayShowQrChange: (v: boolean) => void;
  kioskEnabled: boolean;
  onKioskEnabledChange: (v: boolean) => void;
  averageWaitMinutes: number | null;
  onAverageWaitMinutesChange: (v: number | null) => void;
  listType?: ListType;
  onListTypeChange?: (v: ListType) => void;
};

export default function ListFormFields({
  name,
  onNameChange,
  nameError,
  locationId,
  onLocationChange,
  locations,
  isPending,
  askName,
  onAskNameChange,
  askPhone,
  onAskPhoneChange,
  askEmail,
  onAskEmailChange,
  displayEnabled,
  onDisplayEnabledChange,
  displayShowName,
  onDisplayShowNameChange,
  kioskQrEnabled,
  onKioskQrEnabledChange,
  displayShowQr,
  onDisplayShowQrChange,
  kioskEnabled,
  onKioskEnabledChange,
  averageWaitMinutes,
  onAverageWaitMinutesChange,
  listType = "eat_in",
  onListTypeChange,
}: ListFormFieldsProps) {
  const baseId = useId();
  const askNameId = `${baseId}-ask-name`;
  const askPhoneId = `${baseId}-ask-phone`;
  const askEmailId = `${baseId}-ask-email`;
  const displayShowQrId = `${baseId}-display-show-qr`;
  const displayEnabledId = `${baseId}-display-enabled`;
  const displayShowNameId = `${baseId}-display-show-name`;
  const kioskEnabledId = `${baseId}-kiosk-enabled`;
  const nameLen = name.length;
  const remainingName = Math.max(0, MAX_LIST_NAME_LEN - nameLen);

  return (
    <div className="grid gap-6">
      {/* Basic info */}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Name</Label>
          <Input
            value={name}
            maxLength={MAX_LIST_NAME_LEN}
            onChange={(e) => {
              // Use target.value directly, maxLength attribute handles truncation
              onNameChange(e.target.value);
            }}
            onBlur={(e) => {
              // Ensure value is trimmed on blur
              const trimmed = e.target.value.slice(0, MAX_LIST_NAME_LEN);
              if (trimmed !== name) {
                onNameChange(trimmed);
              }
            }}
            placeholder="Enter list name"
            aria-invalid={nameError ? true : undefined}
            className={nameError ? "border-destructive focus-visible:ring-destructive" : undefined}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground tabular-nums">{remainingName} characters left</p>
          {nameError ? <p className="text-xs text-destructive">{nameError}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label>Location</Label>
          <Select value={locationId} onValueChange={onLocationChange} disabled={isPending}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>List type</Label>
          <Select value={listType} onValueChange={(v) => onListTypeChange?.(v as ListType)} disabled={isPending}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select list type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eat_in">
                <div className="flex flex-col items-start">
                  <span>Eat in</span>
                  <span className="text-xs text-muted-foreground">Party size and seating preferences</span>
                </div>
              </SelectItem>
              <SelectItem value="take_out">
                <div className="flex flex-col items-start">
                  <span>Take out</span>
                  <span className="text-xs text-muted-foreground">No party size or seating</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Label>Average wait time (minutes)</Label>
            <HoverClickTooltip content="Set an average wait time to improve estimated wait time calculations. Leave empty to use only historical data." side="bottom">
              <button type="button" className="inline-flex items-center" aria-label="About average wait time">
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </HoverClickTooltip>
          </div>
          <Input
            type="number"
            min={1}
            max={240}
            placeholder="e.g. 15"
            value={averageWaitMinutes ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                onAverageWaitMinutesChange(null);
              } else {
                const num = parseInt(val, 10);
                if (!isNaN(num) && num > 0 && num <= 240) {
                  onAverageWaitMinutesChange(num);
                }
              }
            }}
          />
          <p className="text-xs text-muted-foreground">Optional. Used to calculate estimated wait times for customers.</p>
        </div>
      </div>

      {/* List preferences - checkboxes in a row */}
      <div className="grid gap-2">
        <Label className="text-sm font-medium">List preferences</Label>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <Checkbox id={askNameId} checked={askName} onCheckedChange={(checked) => onAskNameChange(checked === true)} />
            <label htmlFor={askNameId} className="text-sm cursor-pointer">Name</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={askPhoneId} checked={askPhone} onCheckedChange={(checked) => onAskPhoneChange(checked === true)} />
            <label htmlFor={askPhoneId} className="text-sm cursor-pointer">Phone</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={askEmailId} checked={askEmail} onCheckedChange={(checked) => onAskEmailChange(checked === true)} />
            <label htmlFor={askEmailId} className="text-sm cursor-pointer">Email</label>
          </div>
        </div>
      </div>

      {/* QR Code for self-check-in */}
      <div className="flex items-center gap-3">
        <Switch id={displayShowQrId} checked={kioskQrEnabled} onCheckedChange={onKioskQrEnabledChange} />
        <div className="flex items-center gap-2">
          <Label htmlFor={displayShowQrId}>QR code for self check-in</Label>
          <HoverClickTooltip content="Generate a QR code that guests can scan to join the waitlist from their phones." side="bottom">
            <button type="button" className="inline-flex items-center" aria-label="About QR code">
              <Info className="h-4 w-4 text-muted-foreground" />
            </button>
          </HoverClickTooltip>
        </div>
      </div>

      {/* Public display toggle */}
      <div className="grid gap-3">
        <div className="flex items-center gap-3">
          <Switch id={displayEnabledId} checked={displayEnabled} onCheckedChange={onDisplayEnabledChange} />
          <div className="flex items-center gap-2">
            <Label htmlFor={displayEnabledId}>Public display</Label>
            <HoverClickTooltip content="Enable a public queue display for TVs or tablets." side="bottom">
              <button type="button" className="inline-flex items-center" aria-label="About Public display">
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </HoverClickTooltip>
          </div>
        </div>

        {/* Public display preferences - only show when display is enabled */}
        {displayEnabled ? (
          <div className="ml-10 grid gap-2">
            <Label className="text-sm font-medium text-muted-foreground">Display preferences</Label>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {askName ? (
                <div className="flex items-center gap-2">
                  <Checkbox id={displayShowNameId} checked={displayShowName} onCheckedChange={(checked) => onDisplayShowNameChange(checked === true)} />
                  <label htmlFor={displayShowNameId} className="text-sm cursor-pointer">Show names</label>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <Checkbox id={kioskEnabledId} checked={kioskEnabled} onCheckedChange={(checked) => onKioskEnabledChange(checked === true)} />
                <label htmlFor={kioskEnabledId} className="text-sm cursor-pointer">Kiosk mode</label>
                <HoverClickTooltip content="Show a button on the display so guests can add themselves from a tablet." side="bottom">
                  <button type="button" className="inline-flex items-center" aria-label="About Kiosk mode">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </button>
                </HoverClickTooltip>
              </div>
              {kioskQrEnabled ? (
                <div className="flex items-center gap-2">
                  <Checkbox id={`${displayShowQrId}-display`} checked={displayShowQr} onCheckedChange={(checked) => onDisplayShowQrChange(checked === true)} />
                  <label htmlFor={`${displayShowQrId}-display`} className="text-sm cursor-pointer">Show QR code</label>
                  <HoverClickTooltip content="Display the QR code on the public display screen for guests to scan." side="bottom">
                    <button type="button" className="inline-flex items-center" aria-label="About Show QR code">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </HoverClickTooltip>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
