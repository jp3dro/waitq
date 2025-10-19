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
    productLookupKey: string;
    priceLookupKeyMonthly: string;
  };
}

export const plans: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Plano Grátis",
    priceMonthlyEUR: 0,
    limits: {
      locations: 1,
      users: 1,
      reservationsPerMonth: 50,
      messagesPerMonth: 50,
    },
    features: [
      "Gestão básica de filas e reservas",
      "Estatísticas básicas",
      "Branding do serviço",
      "Suporte básico via email",
    ],
    stripe: {
      productLookupKey: "waitq_free",
      priceLookupKeyMonthly: "waitq_free_monthly_eur",
    },
  },
  base: {
    id: "base",
    name: "Plano Base",
    priceMonthlyEUR: 39,
    limits: {
      locations: 5,
      users: 5,
      reservationsPerMonth: 1000,
      messagesPerMonth: 1000,
    },
    features: [
      "Mensagens personalizáveis",
      "Estatísticas e relatórios detalhados básicos",
      "Exportação de dados simples (CSV)",
      "Suporte por email",
    ],
    stripe: {
      productLookupKey: "waitq_base",
      priceLookupKeyMonthly: "waitq_base_monthly_eur",
    },
  },
  premium: {
    id: "premium",
    name: "Plano Premium",
    priceMonthlyEUR: 99,
    limits: {
      locations: 100,
      users: 100,
      reservationsPerMonth: 5000,
      messagesPerMonth: 5000,
    },
    features: [
      "Analytics detalhados",
      "Relatórios customizáveis internamente",
      "Suporte prioritário por email e telefone",
    ],
    stripe: {
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


