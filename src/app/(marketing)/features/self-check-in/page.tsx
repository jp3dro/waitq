import { getFeaturePageData } from "@/lib/tina";
import { FeaturePageClient } from "@/components/feature-page-client";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getFeaturePageData("self-check-in");
  const seo = data.feature.seo;

  const title = seo?.title || "Self Check-in";
  const description = seo?.description || "Let guests join your waitlist with QR codes or kiosk check-in. No app downloads required.";
  const ogImage = seo?.ogImage || "/og-self-check-in.png";

  return {
    title,
    description,
    openGraph: {
      title: `${title} - WaitQ`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "WaitQ Self Check-in" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - WaitQ`,
      description,
      images: [ogImage],
    },
  };
}

export default async function SelfCheckInPage() {
  const { data, query, variables } = await getFeaturePageData("self-check-in");

  return (
    <FeaturePageClient
      data={data}
      query={query}
      variables={variables}
    />
  );
}
