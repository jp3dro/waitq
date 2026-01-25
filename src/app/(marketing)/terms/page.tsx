import { getTermsPageData } from "@/lib/tina";
import { TermsClient } from "./terms-client";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the WaitQ Terms of Service and Privacy Policy. Learn about your rights and responsibilities when using our restaurant waitlist management software.",
  openGraph: {
    title: "Terms of Service - WaitQ",
    description: "Read the WaitQ Terms of Service and Privacy Policy.",
  },
};

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
