import { getFeaturePageData } from "@/lib/tina";
import { FeaturePageClient } from "@/components/feature-page-client";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getFeaturePageData("virtual-waitlist");
  const seo = data.feature.seo;

  const title = seo?.title || "Virtual Waitlist";
  const description = seo?.description || "The virtual waitlist that keeps customers in the loop. Manage walk-ins, reservations, and SMS updates in one intuitive platform.";
  const ogImage = seo?.ogImage || "/og-virtual-waitlist.png";

  return {
    title,
    description,
    openGraph: {
      title: `${title} - WaitQ`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "WaitQ Virtual Waitlist" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - WaitQ`,
      description,
      images: [ogImage],
    },
  };
}

export default async function VirtualWaitlistPage() {
  const { data, query, variables } = await getFeaturePageData("virtual-waitlist");

  return (
    <FeaturePageClient
      data={data}
      query={query}
      variables={variables}
    />
  );
}
