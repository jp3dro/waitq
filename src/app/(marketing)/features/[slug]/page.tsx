import { notFound } from "next/navigation";
import type { Metadata } from "next";

import client from "../../../../../tina/__generated__/client";
import { getFeaturePageData } from "@/lib/tina";
import { FeaturePageClient } from "@/components/feature-page-client";

export async function generateStaticParams() {
  const conn = await client.queries.featureConnection();
  const pages =
    conn.data.featureConnection.edges?.map((edge) => ({
      slug: edge?.node?._sys.filename,
    })) || [];

  return pages.filter((p) => p.slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await getFeaturePageData(slug);
    const seo = data.feature.seo;

    const title = seo?.title || data.feature.hero?.title || slug;
    const description =
      seo?.description || "Learn more about WaitQ features for modern waitlists.";
    const ogImage = seo?.ogImage || `/og-${slug}.png`;

    return {
      title,
      description,
      openGraph: {
        title: `${title} - WaitQ`,
        description,
        images: [{ url: ogImage, width: 1200, height: 630, alt: String(title) }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} - WaitQ`,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return {
      title: "Page Not Found",
      description: "The requested page could not be found.",
      robots: { index: false, follow: false },
    };
  }
}

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const { data, query, variables } = await getFeaturePageData(slug);
    return <FeaturePageClient data={data} query={query} variables={variables} />;
  } catch {
    notFound();
  }
}

