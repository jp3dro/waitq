import type { Metadata } from "next";
import { notFound } from "next/navigation";

import client from "../../../../tina/__generated__/client";
import {
  getAboutPageData,
  getFeaturePageData,
  getHomePageData,
  getLandingPageData,
  getPricingPageData,
} from "@/lib/tina";

import { HomeClient } from "../home-client";
import { AboutClient } from "../about/about-client";
import { PricingClient } from "../pricing/pricing-client";
import { LandingClient } from "../landing/landing-client";
import { FeaturePageClient } from "@/components/feature-page-client";
import { LegalPageClient } from "../[slug]/legal-page-client";

type RouteParams = { slug?: string[] };

// Common metadata/asset file patterns that should not be handled by this route
const INVALID_SLUG_PATTERNS = [
  /^apple-touch-icon/i,
  /^favicon/i,
  /^robots\.txt$/i,
  /^sitemap/i,
  /^manifest/i,
  /^browserconfig/i,
  /^mstile/i,
  /\.(png|jpg|jpeg|gif|svg|ico|webp|xml|json|txt|css|js|woff|woff2|ttf|eot)$/i,
];

function isInvalidSlug(slug: string): boolean {
  return INVALID_SLUG_PATTERNS.some((pattern) => pattern.test(slug));
}

export async function generateStaticParams() {
  const [featureConn, termsConn, landingConn] = await Promise.all([
    client.queries.featureConnection(),
    client.queries.termsConnection(),
    client.queries.landingPageConnection(),
  ]);

  const featureParams =
    featureConn.data.featureConnection.edges?.flatMap((edge) => {
      const filename = edge?.node?._sys.filename;
      return filename ? [{ slug: ["features", filename] }] : [];
    }) || [];

  const legalParams =
    termsConn.data.termsConnection.edges?.flatMap((edge) => {
      const filename = edge?.node?._sys.filename;
      return filename ? [{ slug: [filename] }] : [];
    }) || [];

  const landingParams =
    landingConn.data.landingPageConnection.edges?.flatMap((edge) => {
      const filename = edge?.node?._sys.filename;
      if (!filename) return [];
      return [{ slug: [filename] }];
    }) || [];

  // Singleton / fixed-route marketing pages (still Tina-backed)
  const fixed = [{ slug: [] as string[] }, { slug: ["pricing"] }, { slug: ["about"] }];

  return [...fixed, ...featureParams, ...landingParams, ...legalParams];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = raw || [];

  // Home
  if (slug.length === 0) {
    const { data } = await getHomePageData();
    const seo = data.home.seo;

    const title = seo?.title || "WaitQ - Digital Waitlist Management System";
    const description =
      seo?.description ||
      "Modern waitlist management that reduces wait times, improves customer experience and turns waiting into a competitive advantage.";
    const ogImage = seo?.ogImage || "/og-home.png";

    return {
      title,
      description,
      keywords: [
        "restaurant waitlist app",
        "queue management software",
        "restaurant queue system",
        "waitlist management",
        "SMS notifications",
        "table management",
        "virtual waitlist",
        "restaurant waitlist software",
      ],
      alternates: {
        canonical:
          typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL
            ? process.env.NEXT_PUBLIC_SITE_URL
            : undefined,
      },
      openGraph: {
        title,
        description,
        type: "website",
        siteName: "WaitQ",
        images: [
          { url: ogImage, width: 1200, height: 630, alt: "WaitQ - Restaurant Waitlist Management" },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  }

  // Features
  if (slug[0] === "features" && slug.length === 2) {
    const featureSlug = slug[1];
    try {
      const { data } = await getFeaturePageData(featureSlug);
      const seo = data.feature.seo;

      const title = seo?.title || data.feature.hero?.title || featureSlug;
      const description =
        seo?.description || "Learn more about WaitQ features for modern waitlists.";
      const ogImage = seo?.ogImage || `/og-${featureSlug}.png`;

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
      return { title: "Page Not Found", robots: { index: false, follow: false } };
    }
  }

  // Fixed pages
  if (slug.length === 1 && slug[0] === "pricing") {
    const { data } = await getPricingPageData();
    const seo = data.pricing.seo;
    const title = seo?.title || "Simple, transparent pricing";
    const description =
      seo?.description ||
      "WaitQ pays for itself with one recovered table a day. Start free, upgrade as you grow.";
    const ogImage = seo?.ogImage || "/og-pricing.png";
    return {
      title,
      description,
      openGraph: {
        title: `${title} - WaitQ`,
        description,
        images: [{ url: ogImage, width: 1200, height: 630, alt: "WaitQ Pricing" }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} - WaitQ`,
        description,
        images: [ogImage],
      },
    };
  }
  if (slug.length === 1 && slug[0] === "about") {
    const { data } = await getAboutPageData();
    const seo = data.about.seo;
    const title = seo?.title || "About WaitQ";
    const description =
      seo?.description ||
      "Learn about WaitQ's mission to transform waiting experiences. We're a small, bootstrapped team building simple, powerful waitlist software.";
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
  // Landing pages
  if (
    slug.length === 1
  ) {
    try {
      const { data } = await getLandingPageData(slug[0]);
      const seo = data.landingPage.seo;

      const title = seo?.title || data.landingPage.hero?.title || slug[0];
      const description =
        seo?.description || "Learn more about WaitQ and how it helps modern restaurants.";
      const ogImage = seo?.ogImage || `/og-${slug[0]}.png`;

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
      // Not a landing page – let other resolvers (legal) handle it.
    }
  }

  // Legal pages (Terms & Legal Pages collection)
  if (slug.length === 1 && !isInvalidSlug(slug[0])) {
    const legalSlug = slug[0];
    try {
      const { data } = await client.queries.terms({ relativePath: `${legalSlug}.mdx` });
      const seo = data.terms.seo;

      const title = seo?.title || data.terms.title || "Legal";
      const description = seo?.description || "WaitQ legal information and policies.";

      return {
        title,
        description,
        openGraph: { title, description },
      };
    } catch {
      return { title: "Page Not Found", robots: { index: false, follow: false } };
    }
  }

  return { title: "Page Not Found", robots: { index: false, follow: false } };
}

export default async function MarketingPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug: raw } = await params;
  const slug = raw || [];

  // Home
  if (slug.length === 0) {
    const { data, query, variables } = await getHomePageData();
    return <HomeClient data={data} query={query} variables={variables} />;
  }

  // Features
  if (slug[0] === "features" && slug.length === 2) {
    const featureSlug = slug[1];
    try {
      const { data, query, variables } = await getFeaturePageData(featureSlug);
      return <FeaturePageClient data={data} query={query} variables={variables} />;
    } catch {
      notFound();
    }
  }

  // Fixed pages
  if (slug.length === 1 && slug[0] === "pricing") {
    const { data, query, variables } = await getPricingPageData();
    return <PricingClient data={data} query={query} variables={variables} />;
  }
  if (slug.length === 1 && slug[0] === "about") {
    const { data, query, variables } = await getAboutPageData();
    return <AboutClient data={data} query={query} variables={variables} />;
  }
  if (slug.length === 1) {
    try {
      const { data, query, variables } = await getLandingPageData(slug[0]);
      return <LandingClient data={data} query={query} variables={variables} />;
    } catch {
      // Not a landing page – let other resolvers (legal) handle it.
    }
  }

  // Legal pages
  if (slug.length === 1 && !isInvalidSlug(slug[0])) {
    const legalSlug = slug[0];
    try {
      const { data, query, variables } = await client.queries.terms({
        relativePath: `${legalSlug}.mdx`,
      });
      return <LegalPageClient data={data} query={query} variables={variables} />;
    } catch {
      notFound();
    }
  }

  notFound();
}

