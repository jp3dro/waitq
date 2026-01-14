import { getAdminClient } from "@/lib/supabase/admin";

type SubscribeStatus = "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR";

/**
 * Best-effort broadcast helper for server-side routes.
 *
 * We intentionally broadcast only lightweight "refresh" signals (no PII payloads).
 * Clients can refetch via their own authorized/public-safe endpoints.
 */
export async function broadcastRefresh(channelName: string, timeoutMs: number = 800): Promise<void> {
  const admin = getAdminClient();

  // Create a channel and wait until subscribed before sending.
  const channel = admin.channel(channelName);

  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try {
        admin.removeChannel(channel);
      } catch { }
      resolve();
    };

    const timer = setTimeout(() => finish(), timeoutMs);

    channel.subscribe(async (status: SubscribeStatus) => {
      if (status !== "SUBSCRIBED") return;
      try {
        await channel.send({ type: "broadcast", event: "refresh", payload: {} });
      } catch {
        // swallow: best-effort
      } finally {
        clearTimeout(timer);
        finish();
      }
    });
  });
}

