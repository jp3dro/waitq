import type { Metadata } from "next";
import { notFound } from "next/navigation";

import client from "../../../../../tina/__generated__/client";
import { BlogArticleClient } from "./blog-article-client";

type RouteParams = { slug: string };

export const dynamic = "force-dynamic";

async function getBlogQueryBySlug(slug: string) {
  // 1) Fast path: most posts will have filename === slug
  try {
    return await client.queries.blog({ relativePath: `${slug}.mdx` });
  } catch {
    // Continue to SEO slug lookup
  }

  // 2) SEO slug path: find the matching document without scanning/pagination issues
  const conn = await client.queries.blogConnection({
    first: 1,
    filter: { seo: { slug: { eq: slug } } },
  });

  const node = conn.data.blogConnection.edges?.[0]?.node;
  const filename = node?._sys?.filename;
  if (!filename) return null;

  try {
    return await client.queries.blog({ relativePath: `${filename}.mdx` });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  try {
    const result = await getBlogQueryBySlug(slug);
    if (!result) return { title: "Post Not Found", robots: { index: false, follow: false } };

    const { data } = result;
    const post = data.blog as any;
    const seo = post.seo as any;

    const title = seo?.title || post.title || "Blog";
    const description = seo?.description || post.excerpt || "WaitQ blog articles.";
    const indexable = seo?.indexable !== false && post.draft !== true;
    const ogImage = seo?.ogImage || post.featuredImage;

    const canonicalFromSeo = seo?.canonicalUrl;
    const canonical =
      canonicalFromSeo ||
      (baseUrl ? `${baseUrl.replace(/\/$/, "")}/blog/${seo?.slug || slug}` : undefined);

    const keywordCandidates = seo?.keywords || post.categories || [];
    const keywords = (keywordCandidates || [])
      .filter(Boolean)
      .map((k: any) => {
        if (typeof k === "string") return k;
        return k?.title || k?.category?.title || k?.category;
      })
      .filter(Boolean);

    return {
      title,
      description,
      keywords,
      ...(indexable ? {} : { robots: { index: false, follow: true } }),
      alternates: canonical ? { canonical } : undefined,
      openGraph: {
        title: `${title} - WaitQ`,
        description,
        type: "article",
        ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: String(title) }] } : {}),
      },
      twitter: {
        card: ogImage ? "summary_large_image" : "summary",
        title: `${title} - WaitQ`,
        description,
        ...(ogImage ? { images: [ogImage] } : {}),
      },
    };
  } catch {
    return { title: "Post Not Found", robots: { index: false, follow: false } };
  }
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;

  const result = await getBlogQueryBySlug(slug);
  if (!result) notFound();

  const { data, query, variables } = result;

  return <BlogArticleClient data={data} query={query} variables={variables} />;
}

