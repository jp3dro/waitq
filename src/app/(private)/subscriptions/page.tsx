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
            <p className="mt-1 text-sm text-neutral-600">Manage your plan and billing</p>
          </div>
        </div>

        <div className="bg-white ring-1 ring-black/5 rounded-xl p-4">
          <div className="text-sm text-neutral-700">
            Current Plan: <span className="font-medium">{orderedPlans.find(p => p.id === currentPlanId)?.name || "Free Plan"}</span>
            {current?.status && current.status !== 'active' && (
              <span className="ml-2 capitalize text-orange-600">({current.status})</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {orderedPlans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlanId;
            return (
              <div key={plan.id} className={`bg-white ring-1 rounded-xl p-6 flex flex-col relative ${
                isCurrentPlan
                  ? 'ring-[#ea580c] bg-orange-50/50'
                  : 'ring-black/5'
              }`}>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  {isCurrentPlan && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ea580c] text-white">
                      Current Plan
                    </span>
                  )}
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {formatEUR(plan.priceMonthlyEUR)} <span className="text-sm font-normal">/ month</span>
                </div>
              </div>
              <ul className="text-sm text-neutral-700 space-y-1 mb-6">
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
              {plan.priceMonthlyEUR === 0 ? (
                isCurrentPlan ? null : (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center w-full rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800"
                  >
                    Included
                  </Link>
                )
              ) : (
                <SubscribeButton
                  lookupKey={plan.stripe.priceLookupKeyMonthly}
                  planId={plan.id}
                  className={`inline-flex items-center justify-center w-full rounded-md px-4 py-2 text-white ${
                    isCurrentPlan ? 'bg-[#ea580c] hover:bg-[#dc2626]' : 'bg-neutral-900 hover:bg-neutral-800'
                  }`}
                >
                  {isCurrentPlan ? 'Manage' : 'Subscribe'}
                </SubscribeButton>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}


