"use client";

import { useTina } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import type { TermsQuery } from "../../../../tina/__generated__/types";

interface LegalPageClientProps {
  query: string;
  variables: Record<string, unknown>;
  data: TermsQuery;
}

export function LegalPageClient(props: LegalPageClientProps) {
  const { data } = useTina(props);
  const page = data.terms;

  return (
    <main className="py-16">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
          {page.lastUpdated && (
            <p className="mt-4 text-sm text-muted-foreground">
              Last updated: {new Date(page.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="mx-auto mt-6 max-w-3xl prose prose-slate dark:prose-invert">
          {page.body && <TinaMarkdown content={page.body} />}
        </div>
      </div>
    </main>
  );
}
