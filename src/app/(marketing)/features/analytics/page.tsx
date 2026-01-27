import { getFeaturePageData } from "@/lib/tina";
import { FeaturePageClient } from "@/components/feature-page-client";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getFeaturePageData("analytics");
  const seo = data.feature.seo;

  const title = seo?.title || "Waitlist Analytics";
  const description = seo?.description || "Get actionable insights from your waitlist data. Track wait times, no-show rates, and customer patterns.";
  const ogImage = seo?.ogImage || "/og-analytics.png";

  return {
    title,
    description,
    openGraph: {
      title: `${title} - WaitQ`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "WaitQ Analytics" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - WaitQ`,
      description,
      images: [ogImage],
    },
  };
}

export default async function AnalyticsPage() {
  const { data, query, variables } = await getFeaturePageData("analytics");

  return (
    <FeaturePageClient
      data={data}
      query={query}
      variables={variables}
    />
  );
}
