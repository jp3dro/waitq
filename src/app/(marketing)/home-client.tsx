"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { YouTubeLightbox } from "@/components/youtube-lightbox";
import { useTina } from "tinacms/dist/react";
import type { HomeQuery } from "../../../tina/__generated__/types";
import { FAQSection } from "@/components/sections/faq-section";
import { CTASection } from "@/components/cta-section";
import { renderMarketingSection } from "@/components/marketing/marketing-section-renderer";

interface HomeClientProps {
  query: string;
  variables: Record<string, unknown>;
  data: HomeQuery;
}

export function HomeClient(props: HomeClientProps) {
  const { data } = useTina(props);
  const page = data.home;

  // Find FAQ section for structured data
  const faqSection = page.sections?.find((s) => s?.__typename === "HomeSectionsFaq");
  const faqStructuredData = faqSection && faqSection.__typename === "HomeSectionsFaq" ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqSection.items?.map((item) => ({
      "@type": "Question",
      "name": item?.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item?.answer
      }
    })) || []
  } : null;

  return (
    <main>
      {faqStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 lg:pt-48 pb-12 -mt-20">
        {/* Background video - hidden when reduce motion is preferred */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay for legibility - only shown with video */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/70"
          aria-hidden="true"
        />

        {/* Fallback background when reduced motion is enabled */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30 block motion-safe:hidden"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[1200px] px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-4xl text-center text-white">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.65)]">
              {page.hero?.title}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/80 max-w-3xl mx-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
              {page.hero?.subtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="px-4">
                <Link href={page.hero?.primaryCtaLink || "/signup"}>{page.hero?.primaryCta}</Link>
              </Button>
              {page.hero?.videoId && (
                <YouTubeLightbox videoId={page.hero.videoId} title="WaitQ demo">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 border-white/30 text-white bg-white/5 hover:bg-white/10 hover:text-white"
                  >
                    <Play className="h-4 w-4" />
                    {page.hero?.secondaryCta}
                  </Button>
                </YouTubeLightbox>
              )}
            </div>
            {/* Trust message */}
            {page.hero?.trustMessage && (
              <p className="mt-6 text-sm text-white/70 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
                {page.hero.trustMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      {page.sections?.map((section, index) => renderMarketingSection(section, index))}
    </main>
  );
}
