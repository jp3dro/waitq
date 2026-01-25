import { getHomePageData } from "@/lib/tina";
import { HomeClient } from "./home-client";

import type { Metadata } from "next";

export const metadata: Metadata = { 
  title: "WaitQ - The virtual waitlist that keeps guests from walking away",
  description: "Modern restaurant waitlist management software with SMS notifications. No app required. Manage queues, reduce wait times, and improve customer experience. Starting at $19/mo.",
  openGraph: {
    title: "WaitQ - The virtual waitlist that keeps guests from walking away",
    description: "Modern restaurant waitlist management software with SMS notifications. No app required. Manage queues, reduce wait times, and improve customer experience.",
    images: [{ url: "/og-home.png", width: 1200, height: 630, alt: "WaitQ - Restaurant Waitlist Management" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WaitQ - The virtual waitlist that keeps guests from walking away",
    description: "Modern restaurant waitlist management software with SMS notifications. No app required.",
    images: ["/og-home.png"],
  },
};

export default async function HomePage() {
  const { data, query, variables } = await getHomePageData();

  return (
    <HomeClient
      data={data}
      query={query}
      variables={variables}
    />
  );
}
