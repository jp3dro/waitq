"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Check,
  Image as ImageIcon,
  Users,
  Smartphone,
  MessageSquare,
  Clock,
  QrCode,
  Zap,
  Monitor,
  Heart,
  BarChart3,
  AlertCircle,
  Ban,
  LayoutGrid,
  TrendingUp,
} from "lucide-react";
import { useTina } from "tinacms/dist/react";
import type { LandingPageQuery, LandingPageSections } from "../../../../tina/__generated__/types";
import { FAQSection } from "@/components/sections/faq-section";
import { IntroSection } from "@/components/sections/intro-section";
import { ArrowLink } from "@/components/sections/arrow-link";
import { BentoGrid } from "@/components/sections/bento-grid";
import { IconCards } from "@/components/sections/icon-cards";
import { HowItWorksCards } from "@/components/sections/how-it-works-cards";
import { CTASection } from "@/components/cta-section";
import { renderMarketingSection } from "@/components/marketing/marketing-section-renderer";

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Smartphone,
  Clock,
  Ban,
  QrCode,
  LayoutGrid,
  TrendingUp,
  MessageSquare,
  Zap,
  Monitor,
  Heart,
  AlertCircle,
  Check,
  BarChart3,
};

function getIcon(iconName: string | null | undefined) {
  if (!iconName) return AlertCircle;
  return iconMap[iconName] || AlertCircle;
}

interface LandingClientProps {
  query: string;
  variables: Record<string, unknown>;
  data: LandingPageQuery;
}

export function LandingClient(props: LandingClientProps) {
  const { data } = useTina(props);
  const page = data.landingPage;

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background to-muted pt-20 pb-16">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {page.hero?.title}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                {page.hero?.subtitle}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                  <Link href={page.hero?.primaryCtaLink || "/signup"}>
                    {page.hero?.primaryCta || "Get started"}
                  </Link>
                </Button>
                {page.hero?.secondaryCta && page.hero?.secondaryCtaLink ? (
                  <Button asChild size="lg" variant="outline">
                    <Link href={page.hero.secondaryCtaLink}>{page.hero.secondaryCta}</Link>
                  </Button>
                ) : null}
              </div>
              {page.hero?.trustMessage ? (
                <p className="mt-6 text-sm text-muted-foreground">{page.hero.trustMessage}</p>
              ) : null}
            </div>
            <div className="relative">
              <div className="aspect-[16/9] overflow-hidden flex items-center justify-center">
                {/* Landing pages don't currently define a hero image field (kept in sections). */}
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="w-24 h-24 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      {page.sections?.map((section, index) => renderMarketingSection(section, index))}
    </main>
  );
}

