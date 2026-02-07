import type { Metadata } from "next";
import Link from "next/link";

import client from "../../../../tina/__generated__/client";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog - WaitQ",
  description:
    "Updates, guides, and best practices for modern waitlist and queue management.",
};

export default async function BlogIndexPage() {
  const conn = await client.queries.blogConnection({ first: 100 });
  const posts =
    conn.data.blogConnection.edges
      ?.map((e) => e?.node)
      .filter(Boolean)
      .filter((n: any) => n.draft !== true)
      .map((n: any) => ({
        filename: n._sys.filename as string,
        slug: (n.seo as any)?.slug || (n._sys.filename as string),
        title: n.title as string,
        excerpt: (n.excerpt as string) || "",
        publishedAt: (n.publishedAt as string) || null,
        categories: (n.categories as string[] | null) || [],
        tags: (n.tags as string[] | null) || [],
      }))
      .sort((a, b) => {
        const ad = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bd = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bd - ad;
      }) || [];

  return (
    <main className="py-20 md:py-24">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="mx-auto max-w-3xl border-b border-border pb-10 mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Blog
          </h1>
          <p className="mt-6 text-base text-muted-foreground">
            Updates, guides, and best practices for modern waitlist and queue
            management.
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          {posts.length === 0 ? (
            <p className="text-muted-foreground">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <article
                key={post.filename}
                className="rounded-2xl border border-border bg-background p-6 hover:bg-muted/30 transition"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                  {post.publishedAt && (
                    <>
                      <span className="inline-block w-2 h-2 rounded-full bg-primary/40" />
                      <span>
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                  {(post.categories?.length || post.tags?.length) ? (
                    <span className="text-muted-foreground/60">•</span>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {(post.categories || []).filter(Boolean).map((c) => (
                      <Badge key={`${post.filename}-cat-${c}`} variant="secondary">
                        {c}
                      </Badge>
                    ))}
                    {(post.tags || []).filter(Boolean).slice(0, 4).map((t) => (
                      <Badge key={`${post.filename}-tag-${t}`} variant="outline">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>

                <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>

                {post.excerpt && (
                  <p className="mt-3 text-muted-foreground">{post.excerpt}</p>
                )}

                <div className="mt-4">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-primary hover:underline font-medium"
                  >
                    Read article
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

