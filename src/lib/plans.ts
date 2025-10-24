export type PlanId = "free" | "base" | "premium";

export type PlanLimitKeys =
  | "locations"
  | "users"
  | "reservationsPerMonth"
  | "messagesPerMonth";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceMonthlyEUR: number; // in euros
  features: string[];
  limits: Record<PlanLimitKeys, number>;
  // Stripe lookup keys allow us to resolve prices without hardcoding IDs
  stripe: {
    // Product IDs are used as the primary mapping from Stripe subscriptions to plans
    productId?: string;
    productLookupKey: string;
    priceLookupKeyMonthly: string;
  };
}

export const plans: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthlyEUR: 0,
    limits: {
      locations: 1,
      users: 1,
      reservationsPerMonth: 50,
      messagesPerMonth: 50,
    },
    features: [
      "Basic queue and reservation management",
      "Basic statistics",
      "Service branding",
      "Basic email support",
    ],
    stripe: {
      productLookupKey: "waitq_free",
      priceLookupKeyMonthly: "waitq_free_monthly_eur",
    },
  },
  base: {
    id: "base",
    name: "Base",
    priceMonthlyEUR: 49,
    limits: {
      locations: 5,
      users: 5,
      reservationsPerMonth: 1000,
      messagesPerMonth: 1000,
    },
    features: [
      "Customizable messages",
      "Basic detailed statistics and reports",
      "Simple data export (CSV)",
      "Email support",
    ],
    stripe: {
      productId:
        process.env.NEXT_PUBLIC_STRIPE_BASE_PRODUCT_ID ||
        (process.env as unknown as Record<string, string | undefined>).NEXT_PUBLIC_STRIPE_BASE_PRODUCTI_ID ||
        "prod_TIQgJJ6PYihM3J",
      productLookupKey: "waitq_base",
      priceLookupKeyMonthly: "waitq_base_monthly_eur",
    },
  },
  premium: {
    id: "premium",
    name: "Premium",
    priceMonthlyEUR: 99,
    limits: {
      locations: 100,
      users: 100,
      reservationsPerMonth: 5000,
      messagesPerMonth: 5000,
    },
    features: [
      "Detailed analytics",
      "Customizable internal reports",
      "Priority email and phone support",
    ],
    stripe: {
      productId:
        process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRODUCT_ID ||
        (process.env as unknown as Record<string, string | undefined>).NEXT_PUBLIC_STRIPE_PREMIUM_PRODUCTI_ID ||
        "prod_TIQgj1LEbwLSaR",
      productLookupKey: "waitq_premium",
      priceLookupKeyMonthly: "waitq_premium_monthly_eur",
    },
  },
};

export function getPlanById(planId: PlanId): PlanDefinition {
  return plans[planId];
}

export const orderedPlans: PlanDefinition[] = [
  plans.free,
  plans.base,
  plans.premium,
];


