"use client";
import { useTransition } from "react";
import { toastManager } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Eraser } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function ClearWaitlistButton({ waitlistId, displayToken, variant = "button", className = "" }: { waitlistId: string; displayToken?: string | null; variant?: "button" | "menu"; className?: string }) {
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const clearWaitlist = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/waitlists", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: waitlistId, action: "clear" }),
        });

        if (res.ok) {
          // Send realtime broadcasts to update all connected clients
          try {
            // Broadcast to main waitlist table
            const chan1 = supabase.channel(`waitlist-entries-${waitlistId}`);
            await chan1.send({ type: 'broadcast', event: 'refresh', payload: {} });
            supabase.removeChannel(chan1);

            // Broadcast to user status pages
            const chan2 = supabase.channel(`user-wl-${waitlistId}`);
            await chan2.send({ type: 'broadcast', event: 'refresh', payload: {} });
            supabase.removeChannel(chan2);

            // Broadcast to public display if token is available
            if (displayToken) {
              const chan3 = supabase.channel(`display-bc-${displayToken}`);
              await chan3.send({ type: 'broadcast', event: 'refresh', payload: {} });
              supabase.removeChannel(chan3);
            }
          } catch (broadcastError) {
            console.warn('Broadcast failed, but deletion succeeded:', broadcastError);
          }

          // Trigger local refresh for immediate UI update
          try {
            window.dispatchEvent(new CustomEvent('wl:refresh', { detail: { waitlistId } }));
          } catch (localRefreshError) {
            console.warn('Local refresh failed:', localRefreshError);
          }

          toastManager.add({
            title: "Success",
            description: "Waitlist cleared (entries archived for analytics)",
            type: "success",
          });
        } else {
          const error = await res.json();
          toastManager.add({
            title: "Error",
            description: error.error || "Failed to clear waitlist",
            type: "error",
          });
        }
      } catch {
        toastManager.add({
          title: "Error",
          description: "Failed to clear waitlist",
          type: "error",
        });
      }
    });
  };

  if (variant === "menu") {
    return (
      <DropdownMenuItem
        onSelect={() => clearWaitlist()}
        disabled={isPending}
        className={className}
      >
        <Eraser className="h-4 w-4" />
        {isPending ? "Clearing..." : "Clear waitlist"}
      </DropdownMenuItem>
    );
  }

  return (
    <Button onClick={clearWaitlist} disabled={isPending} variant="outline" className={className}>
      {isPending ? "Clearing..." : "Clear waitlist"}
    </Button>
  );
}
