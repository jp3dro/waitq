"use client";

import Link from "next/link";
import { orderedPlans } from "@/lib/plans";
import SubscribeButton from "@/app/(private)/subscriptions/subscribe-button";
import { Button } from "@/components/ui/button";

type Props = {
  mode: "manage" | "onboarding";
  currentPlanId?: string;
  disabled?: boolean;
  onFreeAction?: () => void;
  successPath?: string;
  cancelPath?: string;
  billingProvider?: "stripe" | "polar";
};

export default function PlanCards({ mode, currentPlanId, disabled, onFreeAction, successPath, cancelPath, billingProvider }: Props) {
  const isManage = mode === "manage";
  const effectiveCurrentPlanId = isManage ? (currentPlanId ?? "free") : "free";
  const provider = billingProvider || (process.env.NEXT_PUBLIC_BILLING_PROVIDER as "stripe" | "polar" | undefined) || "stripe";
  const providerLabel = provider === "polar" ? "Polar" : "Stripe";

  const pluralize = (n: number, singular: string, plural?: string) => (n === 1 ? singular : (plural ?? `${singular}s`));
  const formatUSD = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {orderedPlans.map((plan) => {
        const isCurrentPlan = isManage && plan.id === effectiveCurrentPlanId;
        const isUpgradeable =
          isManage &&
          effectiveCurrentPlanId !== "free" &&
          plan.id !== effectiveCurrentPlanId &&
          orderedPlans.findIndex((p) => p.id === plan.id) >
            orderedPlans.findIndex((p) => p.id === effectiveCurrentPlanId);

        return (
          <div
            key={plan.id}
            className={`bg-card text-card-foreground ring-1 rounded-xl p-6 flex flex-col justify-between relative ${
              isCurrentPlan ? "ring-primary/80 bg-accent/10" : "ring-border"
            }`}
          >
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
                  {formatUSD(plan.priceMonthlyEUR)} <span className="text-sm font-normal">/ month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <ul className="text-sm text-foreground/80 space-y-1">
                <li>
                  {plan.limits.locations} {pluralize(plan.limits.locations, "Location")}
                </li>
                <li>
                  {plan.limits.users} {pluralize(plan.limits.users, "Staff user", "Staff users")}
                </li>
                <li>
                  {plan.limits.reservationsPerMonth} reservations/queues per month
                </li>
                <li>
                  {plan.limits.messagesPerMonth} SMS/emails per month
                </li>
                {plan.features.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              {plan.priceMonthlyEUR === 0 ? (
                isManage ? (
                  // Hide "Included" when user has an active paid plan
                  effectiveCurrentPlanId !== "free" ? null : isCurrentPlan ? null : (
                    <Button asChild className="w-full" disabled={disabled}>
                      <Link href="/lists">Included</Link>
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={onFreeAction}
                    className="w-full"
                    variant="outline"
                    disabled={disabled}
                    type="button"
                  >
                    Start with a free trial
                  </Button>
                )
              ) : (
                <SubscribeButton
                  lookupKey={plan.stripe.priceLookupKeyMonthly}
                  planId={plan.id}
                  className="w-full"
                  variant={isManage ? (isCurrentPlan ? "default" : isUpgradeable ? "outline" : "default") : "default"}
                  isPortal={isManage ? isCurrentPlan : false}
                  disabled={disabled}
                  successPath={!isManage ? successPath : undefined}
                  cancelPath={!isManage ? cancelPath : undefined}
                  billingProvider={provider}
                >
                  {isManage ? (isCurrentPlan ? `Manage in ${providerLabel}` : isUpgradeable ? "Upgrade" : "Subscribe") : "Subscribe"}
                </SubscribeButton>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


