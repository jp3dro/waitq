import { Checkout } from "@polar-sh/nextjs";

export const runtime = "nodejs";

function resolveServerEnv() {
  const raw = (process.env.POLAR_SERVER || "").toLowerCase().trim();
  if (raw === "production") return "production" as const;
  // Default to sandbox for local migration testing.
  return "sandbox" as const;
}

// This is the "raw" Polar adapter route.
// Prefer sending users to `/api/polar/checkout` which enriches the request with metadata.
export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: process.env.POLAR_SUCCESS_URL!,
  server: resolveServerEnv(),
  // returnUrl renders a back-button in the Polar hosted checkout.
  returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/subscriptions`,
});

