import { getRestaurantPageData } from "@/lib/tina";
import { RestaurantClient } from "./restaurant-client";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WaitQ for Restaurants",
  description: "Maximize table turnover and improve customer satisfaction with the smartest waitlist app for restaurants. Replace paper lists and expensive pagers.",
  openGraph: {
    title: "WaitQ for Restaurants - Smart Waitlist Management",
    description: "Maximize table turnover and improve customer satisfaction with the smartest waitlist app for restaurants.",
    images: [{ url: "/og-restaurants.png", width: 1200, height: 630, alt: "WaitQ for Restaurants" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WaitQ for Restaurants - Smart Waitlist Management",
    description: "Maximize table turnover and improve customer satisfaction with the smartest waitlist app for restaurants.",
    images: ["/og-restaurants.png"],
  },
};

export default async function RestaurantWaitlistAppPage() {
  const { data, query, variables } = await getRestaurantPageData();

  return (
    <RestaurantClient
      data={data}
      query={query}
      variables={variables}
    />
  );
}
