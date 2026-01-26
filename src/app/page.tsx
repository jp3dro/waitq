import MarketingLayout from "./(marketing)/layout";
import MarketingHome from "./(marketing)/page";
import type { Metadata } from "next";
import { getHomePageData } from "@/lib/tina";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getHomePageData();
  const seo = data.home.seo;

  const title = seo?.title || "WaitQ - Digital Waitlist Management System";
  const description = seo?.description || "Modern waitlist management that reduces wait times, improves customer experience and turns waiting into a competitive advantage.";
  const ogImage = seo?.ogImage || "/og-home.png";

  return {
    title,
    description,
    keywords: ["restaurant waitlist app", "queue management software", "restaurant queue system", "waitlist management", "SMS notifications", "table management", "virtual waitlist", "restaurant waitlist software"],
    alternates: {
      canonical: typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL : undefined,
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "WaitQ",
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

export default function Home() {
  return (
    <MarketingLayout>
      <MarketingHome />
    </MarketingLayout>
  );
}
