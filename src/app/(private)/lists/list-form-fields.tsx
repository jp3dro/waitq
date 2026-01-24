 "use client";
 import { useId, useState } from "react";
 import { Info } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
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
   displayShowQr: boolean;
   onDisplayShowQrChange: (v: boolean) => void;
  kioskEnabled: boolean;
  onKioskEnabledChange: (v: boolean) => void;
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
  displayShowQr,
  onDisplayShowQrChange,
  kioskEnabled,
  onKioskEnabledChange,
}: ListFormFieldsProps) {
   const baseId = useId();
   const askNameId = `${baseId}-ask-name`;
   const askPhoneId = `${baseId}-ask-phone`;
   const askEmailId = `${baseId}-ask-email`;
   const kioskEnabledId = `${baseId}-kiosk-enabled`;
   const displayEnabledId = `${baseId}-display-enabled`;
   const displayShowNameId = `${baseId}-display-show-name`;
   const displayShowQrId = `${baseId}-display-show-qr`;
  const nameLen = name.length;
  const remainingName = Math.max(0, MAX_LIST_NAME_LEN - nameLen);
 
   return (
     <div className="grid gap-4">
       <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label>Name</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {remainingName} left
          </span>
        </div>
         <Input
           value={name}
          maxLength={MAX_LIST_NAME_LEN}
          onChange={(e) => onNameChange(e.target.value.slice(0, MAX_LIST_NAME_LEN))}
           placeholder="Enter list name"
           aria-invalid={nameError ? true : undefined}
           className={nameError ? "border-destructive focus-visible:ring-destructive" : undefined}
         />
        <p className="text-xs text-muted-foreground tabular-nums">{nameLen}/{MAX_LIST_NAME_LEN}</p>
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
 
       <div className="grid gap-4 mt-2">
         <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">List preferences</h3>
 
         <div className="flex items-center gap-3">
           <Switch id={askNameId} checked={askName} onCheckedChange={onAskNameChange} />
           <div className="flex items-center gap-2">
             <Label htmlFor={askNameId}>Collect Name</Label>
            <HoverClickTooltip content="Make name field required when joining" side="bottom">
              <button type="button" className="inline-flex items-center" aria-label="About Collect Name">
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </HoverClickTooltip>
           </div>
         </div>
 
         <div className="flex items-center gap-3">
           <Switch id={askPhoneId} checked={askPhone} onCheckedChange={onAskPhoneChange} />
           <div className="flex items-center gap-2">
             <Label htmlFor={askPhoneId}>Collect Phone</Label>
            <HoverClickTooltip content="Make phone field required when joining" side="bottom">
              <button type="button" className="inline-flex items-center" aria-label="About Collect Phone">
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </HoverClickTooltip>
           </div>
         </div>
 
         <div className="flex items-center gap-3">
           <Switch id={askEmailId} checked={askEmail} onCheckedChange={onAskEmailChange} />
           <div className="flex items-center gap-2">
             <Label htmlFor={askEmailId}>Collect Email</Label>
            <HoverClickTooltip content="Show an email field when joining" side="bottom">
              <button type="button" className="inline-flex items-center" aria-label="About Collect Email">
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </HoverClickTooltip>
           </div>
         </div>
 
         <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Public display</h3>
 
         <div className="flex items-center gap-3">
           <Switch id={displayEnabledId} checked={displayEnabled} onCheckedChange={onDisplayEnabledChange} />
           <div className="flex items-center gap-2">
             <Label htmlFor={displayEnabledId}>Public display</Label>
            <HoverClickTooltip content="Enable the public queue display for this waitlist." side="bottom">
              <button type="button" className="inline-flex items-center" aria-label="About Public display">
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </HoverClickTooltip>
           </div>
         </div>
 
         <div className="flex items-center gap-3">
           <Switch id={kioskEnabledId} checked={kioskEnabled} onCheckedChange={onKioskEnabledChange} />
           <div className="flex items-center gap-2">
             <Label htmlFor={kioskEnabledId}>Users can add themselves to the list</Label>
            <HoverClickTooltip
              content="Shows a button on the public display so guests can join the list themselves."
              side="bottom"
            >
              <button type="button" className="inline-flex items-center" aria-label="About self check-in">
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </HoverClickTooltip>
           </div>
         </div>
 
         {displayEnabled && askName ? (
           <div className="flex items-center gap-3">
             <Switch id={displayShowNameId} checked={displayShowName} onCheckedChange={onDisplayShowNameChange} />
             <div className="flex items-center gap-2">
               <Label htmlFor={displayShowNameId}>Show name on display</Label>
              <HoverClickTooltip content="Show customer names on the public display." side="bottom">
                <button type="button" className="inline-flex items-center" aria-label="About Show name on display">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </HoverClickTooltip>
             </div>
           </div>
         ) : null}
 
         {displayEnabled ? (
           <div className="flex items-center gap-3">
             <Switch id={displayShowQrId} checked={displayShowQr} onCheckedChange={onDisplayShowQrChange} />
             <div className="flex items-center gap-2">
               <Label htmlFor={displayShowQrId}>Show QR code on display</Label>
              <HoverClickTooltip content="Show a QR code on the public display for guests to scan and join." side="bottom">
                <button type="button" className="inline-flex items-center" aria-label="About Show QR code on display">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </HoverClickTooltip>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
