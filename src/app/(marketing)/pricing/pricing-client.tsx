"use client";

import { useTina } from "tinacms/dist/react";
import type { PricingQuery } from "../../../../tina/__generated__/types";
import { PricingCards } from "@/components/sections/pricing-cards";
import { FeatureComparison } from "@/components/sections/feature-comparison";
import { SocialProof } from "@/components/sections/social-proof";
import { FAQSection } from "@/components/sections/faq-section";

interface PricingClientProps {
  query: string;
  variables: Record<string, unknown>;
  data: PricingQuery;
}

export function PricingClient(props: PricingClientProps) {
  const { data } = useTina(props);
  const page = data.pricing;

  // Get sections from the new flexible sections array
  const sections = (page as unknown as { sections?: Array<{
    __typename?: string;
    title?: string;
    categories?: Array<{
      name?: string;
      features?: Array<{
        name?: string;
        free?: string;
        base?: string;
        premium?: string;
      } | null> | null;
    } | null> | null;
    stats?: Array<{ value?: string; label?: string } | null> | null;
    testimonial?: { quote?: string; author?: string; role?: string } | null;
    items?: Array<{ question?: string; answer?: string } | null> | null;
  }> }).sections || [];

  // Get pricing cards from the new structure
  const pricingCards = (page as unknown as { pricingCards?: { plans?: Array<{
    planId?: string;
    name?: string;
    description?: string;
    price?: string;
    period?: string;
    highlighted?: boolean;
    highlightLabel?: string;
    features?: Array<{ text?: string } | null> | null;
    ctaText?: string;
    ctaLink?: string;
  } | null> | null } }).pricingCards;

  return (
    <main className="py-20">
      {/* Header */}
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{page.hero?.title}</h1>
          <p className="text-xl text-muted-foreground max-w-[600px]">
            {page.hero?.subtitle}
          </p>
        </div>

        {/* Pricing Cards */}
        {pricingCards?.plans && (
          <PricingCards plans={pricingCards.plans} />
        )}
      </div>

      {/* Dynamic Sections */}
      {sections.map((section, index) => {
        if (!section) return null;

        switch (section.__typename) {
          case "PricingSectionsFeatureComparison":
            return (
              <FeatureComparison
                key={index}
                title={section.title || ""}
                categories={section.categories || []}
              />
            );

          case "PricingSectionsSocialProof":
            return (
              <SocialProof
                key={index}
                title={section.title || ""}
                stats={section.stats}
                testimonial={section.testimonial}
              />
            );

          case "PricingSectionsFaq":
            return (
              <FAQSection
                key={index}
                title={section.title || ""}
                items={(section.items || []).map(item => ({
                  question: item?.question || "",
                  answer: item?.answer || "",
                }))}
              />
            );

          default:
            return null;
        }
      })}
    </main>
  );
}
