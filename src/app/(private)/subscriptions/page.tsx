export const metadata = { title: "Subscription" };

import Link from "next/link";
import { orderedPlans } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import SubscribeButton from "./subscribe-button";

function formatEUR(amount: number) {
  return amount === 0
    ? "€0"
    : new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(
        amount
      );
}

type SubscriptionData = {
  plan_id: string | null;
  status: string | null;
};

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let current: SubscriptionData | null = null;
  if (user) {
    const { data } = await supabase
      .from("subscriptions")
      .select("plan_id, status")
      .eq("user_id", user.id)
      .maybeSingle();
    current = (data as SubscriptionData) || null;
  }

  // Determine current plan - if no active subscription, user is on free tier
  const currentPlanId = current?.status === 'active' ? current.plan_id : 'free';

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {orderedPlans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlanId;
            return (
              <div key={plan.id} className={`bg-card text-card-foreground ring-1 rounded-xl p-6 flex flex-col justify-between relative ${
                isCurrentPlan
                  ? 'ring-primary/80 bg-accent/10'
                  : 'ring-border'
              }`}>
              <div className="grow">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    {isCurrentPlan && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {formatEUR(plan.priceMonthlyEUR)} <span className="text-sm font-normal">/ month</span>
                  </div>
                </div>
                <ul className="text-sm text-foreground/80 space-y-1">
                <li>{plan.limits.locations} locations</li>
                <li>{plan.limits.users} users</li>
                <li>
                  {plan.limits.reservationsPerMonth} reservations/queues per month
                </li>
                <li>{plan.limits.messagesPerMonth} SMS/emails per month</li>
                {plan.features.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
              </div>
              <div className="mt-4">
                {plan.priceMonthlyEUR === 0 ? (
                  isCurrentPlan ? null : (
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
                    >
                      Included
                    </Link>
                  )
                ) : (
                  <SubscribeButton
                    lookupKey={plan.stripe.priceLookupKeyMonthly}
                    planId={plan.id}
                    className={`inline-flex items-center justify-center w-full rounded-md px-4 py-2 ${
                      isCurrentPlan ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-primary text-primary-foreground hover:opacity-90'
                    }`}
                  >
                    {isCurrentPlan ? 'Manage' : 'Subscribe'}
                  </SubscribeButton>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}


