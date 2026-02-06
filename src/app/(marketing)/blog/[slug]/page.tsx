import type { Metadata } from "next";
import { notFound } from "next/navigation";

import client from "../../../../../tina/__generated__/client";
import { BlogArticleClient } from "./blog-article-client";

type RouteParams = { slug: string };

async function resolveBlogFilenameBySlug(slug: string): Promise<string | null> {
  const conn = await client.queries.blogConnection();
  const match = conn.data.blogConnection.edges?.find((edge) => {
    const node = edge?.node;
    if (!node) return false;
    const filename = node._sys.filename;
    const customSlug = (node.seo as any)?.slug;
    return customSlug === slug || filename === slug;
  });
  return match?.node?._sys.filename ?? null;
}

export async function generateStaticParams(): Promise<RouteParams[]> {
  const conn = await client.queries.blogConnection();
  const params =
    conn.data.blogConnection.edges?.flatMap((edge) => {
      const node = edge?.node;
      if (!node) return [];
      const draft = (node as any).draft;
      if (draft) return [];
      const filename = node._sys.filename;
      const customSlug = (node.seo as any)?.slug;
      const slug = customSlug || filename;
      return slug ? [{ slug }] : [];
    }) || [];

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  try {
    const filename = await resolveBlogFilenameBySlug(slug);
    if (!filename) return { title: "Post Not Found", robots: { index: false, follow: false } };

    const { data } = await client.queries.blog({ relativePath: `${filename}.mdx` });
    const post = data.blog as any;
    const seo = post.seo as any;

    const title = seo?.title || post.title || "Blog";
    const description = seo?.description || post.excerpt || "WaitQ blog articles.";
    const indexable = seo?.indexable !== false && post.draft !== true;
    const ogImage = seo?.ogImage || post.featuredImage;

    const canonicalFromSeo = seo?.canonicalUrl;
    const canonical =
      canonicalFromSeo ||
      (baseUrl ? `${baseUrl.replace(/\/$/, "")}/blog/${seo?.slug || filename}` : undefined);

    const keywords = (seo?.keywords || post.tags || post.categories || []).filter(Boolean);

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

  const filename = await resolveBlogFilenameBySlug(slug);
  if (!filename) notFound();

  const { data, query, variables } = await client.queries.blog({
    relativePath: `${filename}.mdx`,
  });

  const post = data.blog as any;
  if (post?.draft) notFound();

  return <BlogArticleClient data={data} query={query} variables={variables} />;
}

