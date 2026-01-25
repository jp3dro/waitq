import { getFeaturePageData } from "@/lib/tina";
import { FeaturePageClient } from "@/components/feature-page-client";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Virtual Waitlist",
  description: "The virtual waitlist that keeps customers in the loop. Manage walk-ins, reservations, and SMS updates in one intuitive platform.",
  openGraph: {
    title: "Virtual Waitlist - WaitQ",
    description: "The virtual waitlist that keeps customers in the loop. Manage walk-ins, reservations, and SMS updates in one intuitive platform.",
    images: [{ url: "/og-virtual-waitlist.png", width: 1200, height: 630, alt: "WaitQ Virtual Waitlist" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtual Waitlist - WaitQ",
    description: "The virtual waitlist that keeps customers in the loop.",
    images: ["/og-virtual-waitlist.png"],
  },
};

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
