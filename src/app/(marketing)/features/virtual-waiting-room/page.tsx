import { getFeaturePageData } from "@/lib/tina";
import { FeaturePageClient } from "@/components/feature-page-client";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Virtual Waiting Room",
  description: "Public displays and status pages that keep guests informed. Real-time wait times on any screen.",
  openGraph: {
    title: "Virtual Waiting Room - WaitQ",
    description: "Public displays and status pages that keep guests informed. Real-time wait times on any screen.",
    images: [{ url: "/og-virtual-waiting-room.png", width: 1200, height: 630, alt: "WaitQ Virtual Waiting Room" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtual Waiting Room - WaitQ",
    description: "Public displays and status pages that keep guests informed.",
    images: ["/og-virtual-waiting-room.png"],
  },
};

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
