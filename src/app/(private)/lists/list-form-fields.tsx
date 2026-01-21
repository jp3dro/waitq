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
 import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
 
 type Location = { id: string; name: string };
 
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
   seatingPrefs: string[];
   onSeatingPrefsChange: (v: string[]) => void;
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
   seatingPrefs,
   onSeatingPrefsChange,
 }: ListFormFieldsProps) {
   const baseId = useId();
   const askNameId = `${baseId}-ask-name`;
   const askPhoneId = `${baseId}-ask-phone`;
   const askEmailId = `${baseId}-ask-email`;
   const kioskEnabledId = `${baseId}-kiosk-enabled`;
   const displayEnabledId = `${baseId}-display-enabled`;
   const displayShowNameId = `${baseId}-display-show-name`;
   const displayShowQrId = `${baseId}-display-show-qr`;
 
   return (
     <div className="grid gap-4">
       <div className="grid gap-2">
         <Label>Name</Label>
         <Input
           value={name}
           onChange={(e) => onNameChange(e.target.value)}
           placeholder="Enter list name"
           aria-invalid={nameError ? true : undefined}
           className={nameError ? "border-destructive focus-visible:ring-destructive" : undefined}
         />
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
             <Tooltip>
               <TooltipTrigger asChild>
                 <Info className="h-4 w-4 text-muted-foreground cursor-help" />
               </TooltipTrigger>
               <TooltipContent side="bottom">Make name field required when joining</TooltipContent>
             </Tooltip>
           </div>
         </div>
 
         <div className="flex items-center gap-3">
           <Switch id={askPhoneId} checked={askPhone} onCheckedChange={onAskPhoneChange} />
           <div className="flex items-center gap-2">
             <Label htmlFor={askPhoneId}>Collect Phone</Label>
             <Tooltip>
               <TooltipTrigger asChild>
                 <Info className="h-4 w-4 text-muted-foreground cursor-help" />
               </TooltipTrigger>
               <TooltipContent side="bottom">Make phone field required when joining</TooltipContent>
             </Tooltip>
           </div>
         </div>
 
         <div className="flex items-center gap-3">
           <Switch id={askEmailId} checked={askEmail} onCheckedChange={onAskEmailChange} />
           <div className="flex items-center gap-2">
             <Label htmlFor={askEmailId}>Collect Email</Label>
             <Tooltip>
               <TooltipTrigger asChild>
                 <Info className="h-4 w-4 text-muted-foreground cursor-help" />
               </TooltipTrigger>
               <TooltipContent side="bottom">Show an email field when joining</TooltipContent>
             </Tooltip>
           </div>
         </div>
 
         <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Public display</h3>
 
         <div className="flex items-center gap-3">
           <Switch id={displayEnabledId} checked={displayEnabled} onCheckedChange={onDisplayEnabledChange} />
           <div className="flex items-center gap-2">
             <Label htmlFor={displayEnabledId}>Public display</Label>
             <Tooltip>
               <TooltipTrigger asChild>
                 <Info className="h-4 w-4 text-muted-foreground cursor-help" />
               </TooltipTrigger>
               <TooltipContent side="bottom">
                 Enable the public queue display for this waitlist.
               </TooltipContent>
             </Tooltip>
           </div>
         </div>
 
         <div className="flex items-center gap-3">
           <Switch id={kioskEnabledId} checked={kioskEnabled} onCheckedChange={onKioskEnabledChange} />
           <div className="flex items-center gap-2">
             <Label htmlFor={kioskEnabledId}>Users can add themselves to the list</Label>
             <Tooltip>
               <TooltipTrigger asChild>
                 <Info className="h-4 w-4 text-muted-foreground cursor-help" />
               </TooltipTrigger>
               <TooltipContent side="bottom">
                 Shows a button on the public display so guests can join the list themselves.
               </TooltipContent>
             </Tooltip>
           </div>
         </div>
 
         {displayEnabled && askName ? (
           <div className="flex items-center gap-3">
             <Switch id={displayShowNameId} checked={displayShowName} onCheckedChange={onDisplayShowNameChange} />
             <div className="flex items-center gap-2">
               <Label htmlFor={displayShowNameId}>Show name on display</Label>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                 </TooltipTrigger>
                 <TooltipContent side="bottom">
                   Show customer names on the public display.
                 </TooltipContent>
               </Tooltip>
             </div>
           </div>
         ) : null}
 
         {displayEnabled ? (
           <div className="flex items-center gap-3">
             <Switch id={displayShowQrId} checked={displayShowQr} onCheckedChange={onDisplayShowQrChange} />
             <div className="flex items-center gap-2">
               <Label htmlFor={displayShowQrId}>Show QR code on display</Label>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                 </TooltipTrigger>
                 <TooltipContent side="bottom">
                   Show a QR code on the public display for guests to scan and join.
                 </TooltipContent>
               </Tooltip>
             </div>
           </div>
         ) : null}
 
         <div className="grid gap-2">
           <Label>Seating preferences</Label>
           <SeatingPrefsEditor value={seatingPrefs} onChange={onSeatingPrefsChange} />
         </div>
       </div>
     </div>
   );
 }
 
 function SeatingPrefsEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
   const [input, setInput] = useState("");
   const add = () => {
     const v = input.trim();
     if (!v) return;
     if (value.includes(v)) return;
     onChange([...value, v]);
     setInput("");
   };
   const remove = (v: string) => onChange(value.filter((x) => x !== v));
   return (
     <div className="grid gap-2">
       <div className="flex gap-2">
         <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add seating preference" />
         <Button type="button" onClick={add} size="sm">
           Add
         </Button>
       </div>
       {value.length ? (
         <ul className="flex flex-wrap gap-2">
           {value.map((v) => (
             <li key={v} className="inline-flex items-center gap-2 rounded-full ring-1 ring-inset ring-border px-3 py-1 text-xs">
               <span>{v}</span>
               <button type="button" onClick={() => remove(v)} className="text-muted-foreground hover:opacity-90">
                 ✕
               </button>
             </li>
           ))}
         </ul>
       ) : null}
     </div>
   );
 }
