import { getTermsPageData } from "@/lib/tina";
import { TermsClient } from "./terms-client";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getTermsPageData();
  const seo = data.terms.seo;

  const title = seo?.title || "Terms of Service";
  const description = seo?.description || "Read the WaitQ Terms of Service and Privacy Policy. Learn about your rights and responsibilities when using our restaurant waitlist management software.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function TermsPage() {
  const { data, query, variables } = await getTermsPageData();

  return (
    <TermsClient
      data={data}
      query={query}
      variables={variables}
    />
  );
}
