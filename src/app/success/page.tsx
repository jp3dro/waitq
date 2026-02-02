import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { SuccessRefreshButton } from "./refresh-button";
import { SuccessAutoRefresh } from "./auto-refresh";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { syncPolarSubscriptionForUser } from "@/lib/polar-sync";

export const metadata = { title: "Success" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(sp: SearchParams, key: string) {
  const v = sp[key];
  return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
}

export default async function SuccessPage(props: { searchParams: Promise<SearchParams> }) {
  const sp = await props.searchParams;
  const checkoutId = first(sp, "checkout_id") || "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the user is signed in, sync from Polar and check subscription
  if (user) {
    try {
      await syncPolarSubscriptionForUser({ userId: user.id });
    } catch {
      // ignore, fall back to cached DB check below
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    const activeLike = new Set(["active", "trialing", "past_due", "paid", "confirmed", "complete", "completed", "succeeded"]);
    const planId = (sub?.plan_id as string | null) || null;
    const status = (sub?.status as string | null) || null;
    const isPaidPlan = planId === "base" || planId === "premium";

    if (status && activeLike.has(status) && isPaidPlan) {
      try {
        const admin = getAdminClient();
        await admin
          .from("profiles")
          .upsert({ id: user.id, onboarding_completed: true, onboarding_step: 5 }, { onConflict: "id" });
      } catch {
        // ignore - still redirect
      }
      redirect("/subscriptions?checkout=success");
    }
  }

  return (
    <main className="py-10">
      <div className="mx-auto max-w-2xl px-4 space-y-6">
        <SuccessAutoRefresh />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Payment started</h1>
          <p className="text-sm text-muted-foreground">
            If you just completed a Polar checkout, the app will update as soon as the subscription is confirmed.
          </p>
        </div>

        {checkoutId ? (
          <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-4 text-sm">
            <div className="text-muted-foreground">Polar checkout id</div>
            <div className="font-mono break-all">{checkoutId}</div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <SuccessRefreshButton />
          <Button asChild variant="default">
            <Link href="/subscriptions">Go to subscriptions</Link>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          If this page doesn't update, go to Subscriptions and refresh—your plan will sync from Polar automatically.
        </div>
      </div>
    </main>
  );
}
