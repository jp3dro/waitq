"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Users,
  Smartphone,
  Clock,
  Check,
  X,
  Zap,
  Monitor,
  Heart,
  QrCode,
  LayoutGrid,
  TrendingUp,
  Ban,
  Image as ImageIcon
} from "lucide-react";
import { useTina } from "tinacms/dist/react";
import type { RestaurantPageQuery } from "../../../../tina/__generated__/types";
import { FAQSection } from "@/components/sections/faq-section";
import { GlobalCTA } from "@/components/sections/global-cta";
import { IntroSection } from "@/components/sections/intro-section";
import { useState } from "react";

// Extended types for content sections
interface HowItWorksItem {
  title: string;
  description: string;
  icon: string;
}

interface BenefitSection {
  title: string;
  description: string;
  image?: string;
}

interface BeforeAfterItem {
  text: string;
  positive: boolean;
}

interface BeforeAfterTab {
  id: string;
  label: string;
  items: BeforeAfterItem[];
}

interface WhyLoveItem {
  title: string;
  description: string;
  icon: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

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
};

function getIcon(iconName: string | null | undefined) {
  if (!iconName) return Users;
  return iconMap[iconName] || Users;
}

interface RestaurantClientProps {
  query: string;
  variables: Record<string, unknown>;
  data: RestaurantPageQuery;
}

export function RestaurantClient(props: RestaurantClientProps) {
  const { data } = useTina(props);
  const page = data.restaurantPage;
  const [activeTab, setActiveTab] = useState("before");

  // Get extended content with proper typing
  type ExtendedPage = {
    hero?: {
      title: string;
      subtitle: string;
      primaryCta?: string;
      primaryCtaLink?: string;
      secondaryCta?: string;
      secondaryCtaLink?: string;
      trustMessage?: string;
    };
    intro?: { title: string; description: string; image?: string };
    howItWorks?: { title: string; items: HowItWorksItem[] };
    benefits?: { title: string; sections: BenefitSection[] };
    beforeAfter?: { title: string; tabs: BeforeAfterTab[] };
    whyLove?: { title: string; items: WhyLoveItem[] };
    faq?: { title: string; items: FAQItem[] };
    globalCta?: {
      title: string;
      subtitle: string;
      primaryButtonText: string;
      primaryButtonLink: string;
      secondaryButtonText?: string;
      secondaryButtonLink?: string;
      trustMessage?: string;
    };
  };
  const extendedPage = page as unknown as ExtendedPage;
  const hero = extendedPage.hero;
  const intro = extendedPage.intro;
  const howItWorks = extendedPage.howItWorks;
  const benefits = extendedPage.benefits;
  const beforeAfter = extendedPage.beforeAfter;
  const whyLove = extendedPage.whyLove;
  const faq = extendedPage.faq;
  const globalCta = extendedPage.globalCta;

  return (
    <main>
      {/* Hero Section - Same style as homepage */}
      <section className="relative overflow-hidden pt-32 lg:pt-48 pb-12 -mt-20 bg-foreground">
        <div className="relative mx-auto max-w-[1200px] px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-primary">
              {hero?.title}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-background/80 max-w-3xl mx-auto">
              {hero?.subtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {hero?.primaryCta && (
                <Button asChild size="lg" className="px-8">
                  <Link href={hero?.primaryCtaLink || "/signup"}>{hero.primaryCta}</Link>
                </Button>
              )}
              {hero?.secondaryCta && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="px-8 border-background/30 text-background bg-background/5 hover:bg-background/10 hover:text-background"
                >
                  <Link href={hero?.secondaryCtaLink || "/pricing"}>{hero.secondaryCta}</Link>
                </Button>
              )}
            </div>
            {/* Trust message */}
            {hero?.trustMessage && (
              <p className="mt-6 text-sm text-background/60">
                {hero.trustMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Intro Section */}
      {intro && (
        <IntroSection
          title={intro.title}
          description={intro.description}
          image={intro.image}
        />
      )}

      {/* The modern waitlist app */}
      {howItWorks && (
        <section className="py-16">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {howItWorks.title}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {howItWorks.items?.map((item, index) => {
                const Icon = getIcon(item?.icon);
                return (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{item?.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item?.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Less time handling the line */}
      {benefits && (
        <section className="py-16">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {benefits.title}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {benefits.sections?.map((section, index) => (
                <div key={index}>
                  <div className="aspect-[4/3] bg-muted rounded-xl shadow-lg overflow-hidden mb-4">
                    {section.image ? (
                      <Image
                        src={section.image}
                        alt={section.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-8">
                          <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/20" />
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold mb-2">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Before/After WaitQ */}
      {beforeAfter && (
        <section className="py-16">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="rounded-3xl bg-muted dark:bg-muted/30 p-6 md:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {beforeAfter.title}
                </h2>
              </div>

              {/* Tab buttons */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex bg-background rounded-full p-1 shadow-sm">
                  {beforeAfter.tabs?.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-2 text-sm font-medium transition-colors rounded-full ${
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              {beforeAfter.tabs?.map((tab) => (
                tab.id === activeTab && (
                  <div key={tab.id} className="max-w-2xl mx-auto">
                    <div className="space-y-4">
                      {tab.items?.map((item, index) => (
                        <div key={index} className="flex items-start gap-3 bg-background rounded-lg p-4">
                          {item.positive ? (
                            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          )}
                          <span className="text-muted-foreground">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why restaurants love WaitQ */}
      {whyLove && (
        <section className="py-16">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {whyLove.title}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {whyLove.items?.map((item, index) => {
                const Icon = getIcon(item?.icon);
                return (
                  <div key={index} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">{item?.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item?.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq?.title && faq?.items && (
        <FAQSection title={faq.title} items={faq.items} />
      )}

      {/* Global CTA */}
      {globalCta && (
        <GlobalCTA
          title={globalCta.title}
          subtitle={globalCta.subtitle}
          primaryButtonText={globalCta.primaryButtonText}
          primaryButtonLink={globalCta.primaryButtonLink}
          secondaryButtonText={globalCta.secondaryButtonText}
          secondaryButtonLink={globalCta.secondaryButtonLink}
          trustMessage={globalCta.trustMessage}
        />
      )}
    </main>
  );
}
