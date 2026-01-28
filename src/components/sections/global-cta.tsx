"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface GlobalCTAProps {
  title: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
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
  return (
    <section className="pt-8 pb-4">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="rounded-3xl bg-foreground text-background p-8 md:p-16 text-center">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-primary">
            {title}
          </h2>
          <p className="mt-4 text-lg text-background/80 max-w-2xl mx-auto">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="px-8">
              <Link href={primaryButtonLink}>{primaryButtonText}</Link>
            </Button>
            {secondaryButtonText && secondaryButtonLink && (
              <Button asChild size="lg" variant="outline" className="px-8 border-background/30 text-background bg-background/5 hover:bg-background/10 hover:text-background">
                <Link href={secondaryButtonLink}>{secondaryButtonText}</Link>
              </Button>
            )}
          </div>
          {trustMessage && (
            <p className="mt-6 text-sm text-background/60">
              {trustMessage}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
