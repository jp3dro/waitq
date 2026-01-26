import { getFeaturePageData } from "@/lib/tina";
import { FeaturePageClient } from "@/components/feature-page-client";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getFeaturePageData("virtual-waiting-room");
  const seo = data.feature.seo;

  const title = seo?.title || "Virtual Waiting Room";
  const description = seo?.description || "Public displays and status pages that keep guests informed. Real-time wait times on any screen.";
  const ogImage = seo?.ogImage || "/og-virtual-waiting-room.png";

  return {
    title,
    description,
    openGraph: {
      title: `${title} - WaitQ`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "WaitQ Virtual Waiting Room" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - WaitQ`,
      description,
      images: [ogImage],
    },
  };
}

export default async function VirtualWaitingRoomPage() {
  const { data, query, variables } = await getFeaturePageData("virtual-waiting-room");

  return (
    <FeaturePageClient
      data={data}
      query={query}
      variables={variables}
    />
  );
}
