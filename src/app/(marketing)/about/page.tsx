import { getAboutPageData } from "@/lib/tina";
import { AboutClient } from "./about-client";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getAboutPageData();
  const seo = data.about.seo;

  const title = seo?.title || "About WaitQ";
  const description = seo?.description || "Learn about WaitQ's mission to transform waiting experiences. We're a small, bootstrapped team building simple, powerful waitlist software.";
  const ogImage = seo?.ogImage || "/og-about.png";

  return {
    title,
    description,
    openGraph: {
      title: `${title} - WaitQ`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "About WaitQ" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - WaitQ`,
      description,
      images: [ogImage],
    },
  };
}

export default async function AboutPage() {
  const { data, query, variables } = await getAboutPageData();

  return (
    <AboutClient
      data={data}
      query={query}
      variables={variables}
    />
  );
}
