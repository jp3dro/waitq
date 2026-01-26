import { getPricingPageData } from "@/lib/tina";
import { PricingClient } from "./pricing-client";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getPricingPageData();
  const seo = data.pricing.seo;

  const title = seo?.title || "Simple, transparent pricing";
  const description = seo?.description || "WaitQ pays for itself with one recovered table a day. Start free, upgrade as you grow.";
  const ogImage = seo?.ogImage || "/og-pricing.png";

  return {
    title,
    description,
    openGraph: {
      title: `${title} - WaitQ`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "WaitQ Pricing" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - WaitQ`,
      description,
      images: [ogImage],
    },
  };
}

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
