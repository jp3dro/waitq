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
    <main className="py-20 md:py-24">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        {/* Header Section */}
        <div className="mx-auto max-w-3xl border-b border-border pb-10 mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {page.title}
          </h1>
          {page.lastUpdated && (
            <p className="mt-6 text-base text-muted-foreground flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary/40" />
              Last updated: {new Date(page.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Content Section */}
        <div className="mx-auto max-w-3xl">
          <article className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:underline prose-img:rounded-2xl max-w-none">
            {page.body && <TinaMarkdown content={page.body} />}
          </article>
        </div>
      </div>
    </main>
  );
}
