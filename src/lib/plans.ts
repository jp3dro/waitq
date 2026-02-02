export type PlanId = "free" | "base" | "premium";

export type PlanLimitKeys =
  | "locations"
  | "users"
  | "reservationsPerMonth"
  | "messagesPerMonth";

export interface PlanFeature {
  name: string;
  included: boolean | string;
  category: "Waitlist" | "Reservations" | "Communications" | "Analytics & Reports" | "Management";
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  priceMonthlyUSD: number;
  features: string[];
  limits: Record<PlanLimitKeys, number>;
}

export const plans: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    description: "Perfect for testing the waters and small establishments.",
    priceMonthlyUSD: 0,
    limits: {
      locations: 1,
      users: 1,
      reservationsPerMonth: 50,
      messagesPerMonth: 50,
    },
    features: [
      "Today analytics only",
    ],
  },
  base: {
    id: "base",
    name: "Base",
    description: "Essential features for growing busy restaurants.",
    priceMonthlyUSD: 49,
    limits: {
      locations: 5,
      users: 10,
      reservationsPerMonth: 1000,
      messagesPerMonth: 1000,
    },
    features: [
      "Advanced analytics up to 30 days",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    description: "Unleash the full power with advanced analytics and support.",
    priceMonthlyUSD: 99,
    limits: {
      locations: 100,
      users: 100,
      reservationsPerMonth: 5000,
      messagesPerMonth: 5000,
    },
    features: [
      "Advanced analytics up to 90 days",
    ],
  },
};

export const pricingFeatures = [
  {
    category: "Waitlist",
    name: "Digital Waitlist",
    free: true,
    base: true,
    premium: true,
  },
  {
    category: "Waitlist",
    name: "Unlimited Daily Entries",
    free: true,
    base: true,
    premium: true,
  },
  {
    category: "Waitlist",
    name: "Customer Self-Check-in",
    free: true,
    base: true,
    premium: true,
  },
  {
    category: "Waitlist",
    name: "Real-time Updates",
    free: true,
    base: true,
    premium: true,
  },
  {
    category: "Communications",
    name: "SMS Notifications",
    free: "50/mo",
    base: "1,000/mo",
    premium: "5,000/mo",
  },
  {
    category: "Communications",
    name: "Email Notifications",
    free: false,
    base: true,
    premium: true,
  },
  {
    category: "Communications",
    name: "Custom Messages",
    free: false,
    base: true,
    premium: true,
  },
  {
    category: "Analytics & Reports",
    name: "Today Analytics",
    free: true,
    base: true,
    premium: true,
  },
  {
    category: "Analytics & Reports",
    name: "Advanced Analytics",
    free: false,
    base: "30 days",
    premium: "90 days",
  },
  {
    category: "Analytics & Reports",
    name: "Export Reports",
    free: false,
    base: true,
    premium: true,
  },
  {
    category: "Management",
    name: "Locations",
    free: "1",
    base: "5",
    premium: "100",
  },
  {
    category: "Management",
    name: "Team Members",
    free: "1",
    base: "10",
    premium: "100",
  },
  {
    category: "Management",
    name: "Priority Support",
    free: false,
    base: false,
    premium: true,
  },
];

export const orderedPlans: PlanDefinition[] = [plans.free, plans.base, plans.premium];

export function getPlanById(planId: PlanId | null | undefined): PlanDefinition {
  if (!planId || !plans[planId]) return plans.free;
  return plans[planId];
}
