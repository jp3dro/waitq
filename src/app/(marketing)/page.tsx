import { getHomePageData } from "@/lib/tina";
import { HomeClient } from "./home-client";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getHomePageData();
  const seo = data.home.seo;

  const title = seo?.title || "WaitQ - Digital Waitlist Management System";
  const description = seo?.description || "Modern waitlist management that reduces wait times, improves customer experience and turns waiting into a competitive advantage.";
  const ogImage = seo?.ogImage || "/og-home.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "WaitQ - Restaurant Waitlist Management" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

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
