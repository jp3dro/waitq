import { getRestaurantPageData } from "@/lib/tina";
import { RestaurantClient } from "./restaurant-client";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getRestaurantPageData();
  const seo = data.restaurantPage.seo;

  const title = seo?.title || "WaitQ for Restaurants";
  const description = seo?.description || "Maximize table turnover and improve customer satisfaction with the smartest waitlist app for restaurants. Replace paper lists and expensive pagers.";
  const ogImage = seo?.ogImage || "/og-restaurants.png";

  return {
    title,
    description,
    openGraph: {
      title: `${title} - Smart Waitlist Management`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "WaitQ for Restaurants" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - Smart Waitlist Management`,
      description,
      images: [ogImage],
    },
  };
}

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
