"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlanFeature {
  text?: string | null;
}

interface PricingPlan {
  planId?: string | null;
  name?: string | null;
  description?: string | null;
  price?: string | null;
  period?: string | null;
  highlighted?: boolean | null;
  highlightLabel?: string | null;
  features?: (PlanFeature | null)[] | null;
  ctaText?: string | null;
  ctaLink?: string | null;
}

interface PricingCardsProps {
  plans: (PricingPlan | null)[];
}

/**
 * Pricing Cards Section - Displays pricing plans in a 3-column grid
 */
export function PricingCards({ plans }: PricingCardsProps) {
  if (!plans || plans.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-[1100px] mx-auto mb-8">
      {plans.map((plan, index) => {
        if (!plan) return null;
        
        const isHighlighted = plan.highlighted;
        
        return (
          <div
            key={index}
            className={`rounded-2xl p-6 relative ${
              isHighlighted
                ? "border-2 border-primary bg-card shadow-lg"
                : "border border-border bg-card"
            }`}
          >
            {isHighlighted && plan.highlightLabel && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  {plan.highlightLabel}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="mt-2 text-muted-foreground">{plan.description}</p>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-bold">{plan.price}</span>
              <span className="text-lg text-muted-foreground">{plan.period}</span>
            </div>
            {plan.features && plan.features.length > 0 && (
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature, featureIndex) => {
                  if (!feature?.text) return null;
                  return (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
                      <span className="text-muted-foreground">{feature.text}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <Button
              asChild
              className="w-full mt-8"
              variant={isHighlighted ? "default" : "outline"}
              size="lg"
            >
              <Link href={plan.ctaLink || "/signup"}>{plan.ctaText || "Get started"}</Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
