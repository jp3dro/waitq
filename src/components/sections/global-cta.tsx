"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface GlobalCTAProps {
  title: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonLink?: string | null;
  secondaryButtonText?: string;
  secondaryButtonLink?: string | null;
  trustMessage?: string;
}

/**
 * Reusable CTA section with dark background.
 * Used at the bottom of marketing pages.
 * Design: "The smart way to manage walk-in customers"
 */
export function GlobalCTA({
  title,
  subtitle,
  primaryButtonText,
  primaryButtonLink,
  secondaryButtonText,
  secondaryButtonLink,
  trustMessage,
}: GlobalCTAProps) {
  const primaryHref = (typeof primaryButtonLink === "string" && primaryButtonLink.trim().length)
    ? primaryButtonLink
    : "/signup";
  const secondaryHref = (typeof secondaryButtonLink === "string" && secondaryButtonLink.trim().length)
    ? secondaryButtonLink
    : null;

  return (
    <section className="pt-4 pb-16">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="rounded-3xl bg-orange-100 dark:bg-orange-400/10 text-background p-8 md:p-16 text-center">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-primary">
            {title}
          </h2>
          <p className="mt-4 text-lg text-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="px-8">
              <Link href={primaryHref}>{primaryButtonText}</Link>
            </Button>
            {secondaryButtonText && secondaryHref && (
              <Button asChild size="lg" variant="outline" className="px-8 text-foreground bg-background hover:text-foreground">
                <Link href={secondaryHref}>{secondaryButtonText}</Link>
              </Button>
            )}
          </div>
          {trustMessage && (
            <p className="mt-6 text-sm text-muted-foreground">
              {trustMessage}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
