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
  Zap,
  Monitor,
  Heart,
  QrCode,
  LayoutGrid,
  TrendingUp,
  Ban,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { useTina } from "tinacms/dist/react";
import type { RestaurantPageQuery } from "../../../../tina/__generated__/types";
import { FAQSection } from "@/components/sections/faq-section";
import { GlobalCTA } from "@/components/sections/global-cta";
import { IntroSection } from "@/components/sections/intro-section";
import { ArrowLink } from "@/components/sections/arrow-link";

// Extended types for content sections
interface HowItWorksItem {
  title: string;
  description: string;
  icon: string;
}

interface StepBullet {
  text: string;
}

interface BenefitStep {
  stepNumber?: number;
  title: string;
  bullets?: StepBullet[];
  link?: string;
  linkText?: string;
  image?: string;
}

interface BeforeItem {
  title: string;
  description: string;
  icon?: string;
}

interface AfterItem {
  title: string;
  description: string;
  icon?: string;
}

interface WhyLoveItem {
  title: string;
  description: string;
  image?: string;
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
  AlertCircle,
  Check,
};

function getIcon(iconName: string | null | undefined) {
  if (!iconName) return AlertCircle;
  return iconMap[iconName] || AlertCircle;
}

interface RestaurantClientProps {
  query: string;
  variables: Record<string, unknown>;
  data: RestaurantPageQuery;
}

export function RestaurantClient(props: RestaurantClientProps) {
  const { data } = useTina(props);
  const page = data.restaurantPage;

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
    benefits?: { title: string; steps: BenefitStep[] };
    beforeAfter?: {
      title: string;
      subtitle?: string;
      beforeTitle: string;
      afterTitle: string;
      beforeItems: BeforeItem[];
      afterItems: AfterItem[];
    };
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

      {/* Less time handling the line - Steps design */}
      {benefits && benefits.steps && (
        <section className="py-16">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-12">
              {benefits.title}
            </h2>

            <div className="space-y-16">
              {benefits.steps.map((step, index) => (
                <div key={index} className="grid lg:grid-cols-2 gap-8 items-center">
                  {/* Content */}
                  <div>
                    {/* Step badge */}
                    <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm mb-4">
                      Step {step.stepNumber || index + 1}
                    </div>

                    <h3 className="text-xl font-bold mb-4">{step.title}</h3>

                    {step.bullets && step.bullets.length > 0 && (
                      <ul className="space-y-3 mb-4">
                        {step.bullets.map((bullet, bulletIndex) => (
                          <li key={bulletIndex} className="flex items-start gap-3">
                            <span className="text-primary font-semibold mt-0.5 flex-shrink-0">
                              <Check className="w-4 h-4" />
                            </span>
                            <span className="text-muted-foreground">{bullet.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {step.link && step.linkText && (
                      <ArrowLink href={step.link}>{step.linkText}</ArrowLink>
                    )}
                  </div>

                  {/* Image */}
                  <div className="relative">
                    <div className="aspect-[4/3] bg-muted rounded-2xl shadow-lg overflow-hidden">
                      {step.image ? (
                        <Image
                          src={step.image}
                          alt={step.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="w-16 h-16 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Before/After - Side by side comparison (no tabs) */}
      {beforeAfter && (
        <section className="py-16">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {beforeAfter.title}
              </h2>
              {beforeAfter.subtitle && (
                <p className="mt-2 text-muted-foreground">
                  {beforeAfter.subtitle}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Before Column */}
              <div className="space-y-4">
                <div className="rounded-xl bg-red-50 dark:bg-red-950/20 p-4">
                  <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">
                    {beforeAfter.beforeTitle || "Before WaitQ"}
                  </h3>
                </div>
                {beforeAfter.beforeItems?.map((item, index) => {
                  const Icon = getIcon(item.icon);
                  return (
                    <div
                      key={index}
                      className="rounded-xl border border-border bg-card p-5 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* After Column */}
              <div className="space-y-4">
                <div className="rounded-xl bg-green-50 dark:bg-green-950/20 p-4">
                  <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
                    {beforeAfter.afterTitle || "With WaitQ"}
                  </h3>
                </div>
                {beforeAfter.afterItems?.map((item, index) => {
                  const Icon = getIcon(item.icon);
                  return (
                    <div
                      key={index}
                      className="rounded-xl border border-border bg-card p-5 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why restaurants love WaitQ - Bento Box Layout */}
      {whyLove && (
        <section className="py-8">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {whyLove.title}
              </h2>
            </div>

            {/* Bento Box Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* First two items - Large cards (3 cols each) */}
              {whyLove.items?.slice(0, 2).map((item, index) => (
                <div
                  key={index}
                  className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 flex flex-col"
                >
                  <h3 className="font-semibold text-lg mb-2">{item?.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {item?.description}
                  </p>
                  <div className="mt-auto aspect-[16/10] bg-muted rounded-xl overflow-hidden">
                    {item?.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={500}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Next items - Small cards (2 cols each) */}
              {whyLove.items?.slice(2, 5).map((item, index) => (
                <div
                  key={index + 2}
                  className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 flex flex-col"
                >
                  <h3 className="font-semibold mb-2">{item?.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {item?.description}
                  </p>
                  <div className="mt-auto aspect-[4/3] bg-muted rounded-xl overflow-hidden">
                    {item?.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={300}
                        height={225}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
