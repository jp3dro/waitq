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
  priceMonthlyEUR: number; // in euros
  features: string[]; // High-level features for the cards
  limits: Record<PlanLimitKeys, number>;
  // Stripe lookup keys allow us to resolve prices without hardcoding IDs
  stripe: {
    // Product ID - same variable name, different value per environment
    productId?: string;
    productLookupKey: string;
    priceLookupKeyMonthly: string;
  };
}

export const plans: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    description: "Perfect for testing the waters and small establishments.",
    priceMonthlyEUR: 0,
    limits: {
      locations: 1,
      users: 2,
      reservationsPerMonth: 50,
      messagesPerMonth: 50,
    },
    features: [
      "Today analytics only",
    ],
    stripe: {
      productLookupKey: "waitq_free",
      priceLookupKeyMonthly: "waitq_free_monthly_eur",
    },
  },
  base: {
    id: "base",
    name: "Base",
    description: "Essential features for growing busy restaurants.",
    priceMonthlyEUR: 49,
    limits: {
      locations: 5,
      users: 10,
      reservationsPerMonth: 1000,
      messagesPerMonth: 1000,
    },
    features: [
      "Advanced analytics up to 30 days",
    ],
    stripe: {
      productId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID, // Auto-switches per environment
      productLookupKey: "waitq_base",
      priceLookupKeyMonthly: "BASE",
    },
  },
  premium: {
    id: "premium",
    name: "Premium",
    description: "Unleash the full power with advanced analytics and support.",
    priceMonthlyEUR: 99,
    limits: {
      locations: 100,
      users: 100,
      reservationsPerMonth: 5000,
      messagesPerMonth: 5000,
    },
    features: [
      "Advanced analytics up to 30 days",
    ],
    stripe: {
      productId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID, // Auto-switches per environment
      productLookupKey: "waitq_premium",
      priceLookupKeyMonthly: "PREMIUM",
    },
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
    name: "Waitlist Position Tracking",
    free: true,
    base: true,
    premium: true,
  },
  {
    category: "Waitlist",
    name: "QR Code Check-in",
    free: true,
    base: true,
    premium: true,
  },
  {
    category: "Waitlist",
    name: "Public Status Page",
    free: true,
    base: true,
    premium: true,
  },
  {
    category: "Waitlist",
    name: "Virtual Queue Advertising Banner",
    free: false,
    base: false,
    premium: false,
  },
  {
    category: "Waitlist",
    name: "Dynamic QR Code",
    free: false,
    base: false,
    premium: false,
  },
  {
    category: "Reservations",
    name: "Online Reservations",
    free: true,
    base: true,
    premium: true,
  },
  {
    category: "Reservations",
    name: "Email Confirmations",
    free: true,
    base: true,
    premium: true,
  },
  {
    category: "Reservations",
    name: "Ticket Sales & Pre-payments",
    free: false,
    base: false,
    premium: false,
  },
  {
    category: "Reservations",
    name: "Experience Review Emails",
    free: false,
    base: false,
    premium: false,
  },
  {
    category: "Reservations",
    name: "Deposits (Credit Card Guarantee)",
    free: false,
    base: false,
    premium: "Coming Soon",
  },
  {
    category: "Communications",
    name: "SMS Notifications",
    free: "50 total",
    base: "1,000 / mo",
    premium: "5,000 / mo",
  },
  {
    category: "Communications",
    name: "Bidirectional SMS",
    free: false,
    base: true,
    premium: true,
  },
  {
    category: "Communications",
    name: "Customizable SMS Templates",
    free: false,
    base: true,
    premium: true,
  },
  {
    category: "Analytics & Reports",
    name: "Usage Statistics",
    free: "Today analytics only",
    base: "Advanced analytics up to 30 days",
    premium: "Advanced analytics up to 30 days",
  },
  {
    category: "Analytics & Reports",
    name: "Data Export (CSV)",
    free: false,
    base: true,
    premium: true,
  },
  {
    category: "Analytics & Reports",
    name: "UTM Parameter Tracking",
    free: false,
    base: false,
    premium: false,
  },
  {
    category: "Management",
    name: "Multi-location Support",
    free: "1 Location",
    base: "5 Locations",
    premium: "100 Locations",
  },
  {
    category: "Management",
    name: "Multi-device Sync & Login",
    free: true,
    base: true,
    premium: true,
  },
  {
    category: "Management",
    name: "Graphic Table Map",
    free: false,
    base: false,
    premium: false,
  },
  {
    category: "Management",
    name: "Reserve with Google",
    free: false,
    base: false,
    premium: false,
  },
];


export function getPlanById(planId: PlanId): PlanDefinition {
  return plans[planId];
}

export const orderedPlans: PlanDefinition[] = [
  plans.free,
  plans.base,
  plans.premium,
];


