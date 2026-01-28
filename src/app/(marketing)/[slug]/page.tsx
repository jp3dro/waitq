import { notFound } from "next/navigation";
import client from "../../../../tina/__generated__/client";
import { LegalPageClient } from "./legal-page-client";
import type { Metadata } from "next";

// Generate static params for all legal pages
export async function generateStaticParams() {
  const termsConnection = await client.queries.termsConnection();
  const pages = termsConnection.data.termsConnection.edges?.map((edge) => ({
    slug: edge?.node?._sys.filename,
  })) || [];

  return pages.filter((p) => p.slug);
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data } = await client.queries.terms({ relativePath: `${slug}.mdx` });
    const seo = data.terms.seo;

    const title = seo?.title || data.terms.title || "Legal";
    const description = seo?.description || "WaitQ legal information and policies.";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Page Not Found",
      description: "The requested page could not be found.",
    };
  }
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;

  try {
    const { data, query, variables } = await client.queries.terms({ relativePath: `${slug}.mdx` });

    return (
      <LegalPageClient
        data={data}
        query={query}
        variables={variables}
      />
    );
  } catch {
    notFound();
  }
}
