"use client";
import { useTransition } from "react";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function ClearWaitlistButton({ waitlistId, displayToken }: { waitlistId: string; displayToken?: string | null }) {
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

          toast.success("Waitlist cleared successfully");
        } else {
          const error = await res.json();
          toast.error(error.error || "Failed to clear waitlist");
        }
      } catch {
        toast.error("Failed to clear waitlist");
      }
    });
  };

  return (
    <button
      onClick={clearWaitlist}
      disabled={isPending}
      className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-red-600 text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? "Clearing..." : "Clear Waitlist"}
    </button>
  );
}
