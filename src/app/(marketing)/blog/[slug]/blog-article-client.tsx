"use client";

import Image from "next/image";
import { useTina } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";

import { Badge } from "@/components/ui/badge";
import type { BlogQuery } from "../../../../../tina/__generated__/types";

interface BlogArticleClientProps {
  query: string;
  variables: Record<string, unknown>;
  data: BlogQuery;
}

export function BlogArticleClient(props: BlogArticleClientProps) {
  const { data } = useTina(props);
  const post = data.blog;

  const publishedAt = post.publishedAt ? new Date(post.publishedAt) : null;
  const categories = (post.categories || [])
    .filter(Boolean)
    .map((c: any) => {
      // Supports both legacy string lists and the new object-list with reference
      if (typeof c === "string") return c;
      return c?.category?.title || c?.category;
    })
    .filter(Boolean) as string[];

  return (
    <main className="py-20 md:py-24">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="mx-auto max-w-3xl border-b border-border pb-10 mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {post.title}
          </h1>

          {(publishedAt || post.author) && (
            <p className="mt-6 text-base text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2">
              {publishedAt && (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-primary/40" />
                  <span>{publishedAt.toLocaleDateString()}</span>
                </>
              )}
              {post.author && (
                <>
                  <span className="text-muted-foreground/60">•</span>
                  <span>{post.author}</span>
                </>
              )}
            </p>
          )}

          {categories.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((c) => (
                <Badge key={`cat-${c}`} variant="secondary">
                  {c}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="mx-auto max-w-3xl">
          {post.featuredImage && (
            <div className="mb-10">
              <Image
                src={post.featuredImage}
                alt={post.title || "Blog featured image"}
                width={1200}
                height={630}
                className="w-full h-auto rounded-2xl border border-border"
                priority
              />
            </div>
          )}

          {post.excerpt && (
            <p className="mb-10 text-lg text-muted-foreground">
              {post.excerpt}
            </p>
          )}

          <article className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:underline prose-img:rounded-2xl max-w-none">
            {post.body && <TinaMarkdown content={post.body} />}
          </article>
        </div>
      </div>
    </main>
  );
}

