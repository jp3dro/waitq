import { getFeaturePageData } from "@/lib/tina";
import { FeaturePageClient } from "@/components/feature-page-client";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Self Check-in",
  description: "Let guests join your waitlist with QR codes or kiosk check-in. No app downloads required.",
  openGraph: {
    title: "Self Check-in - WaitQ",
    description: "Let guests join your waitlist with QR codes or kiosk check-in. No app downloads required.",
    images: [{ url: "/og-self-check-in.png", width: 1200, height: 630, alt: "WaitQ Self Check-in" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Self Check-in - WaitQ",
    description: "Let guests join your waitlist with QR codes or kiosk check-in.",
    images: ["/og-self-check-in.png"],
  },
};

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
