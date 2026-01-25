import { getPricingPageData } from "@/lib/tina";
import { PricingClient } from "./pricing-client";

import type { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Simple, transparent pricing",
  description: "WaitQ pays for itself with one recovered table a day. Start free, upgrade as you grow.",
  openGraph: {
    title: "Simple, transparent pricing - WaitQ",
    description: "WaitQ pays for itself with one recovered table a day. Start free, upgrade as you grow.",
    images: [{ url: "/og-pricing.png", width: 1200, height: 630, alt: "WaitQ Pricing" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Simple, transparent pricing - WaitQ",
    description: "WaitQ pays for itself with one recovered table a day. Start free, upgrade as you grow.",
    images: ["/og-pricing.png"],
  },
};

export default async function PricingPage() {
  const { data, query, variables } = await getPricingPageData();

  return (
    <PricingClient
      data={data}
      query={query}
      variables={variables}
    />
  );
}
