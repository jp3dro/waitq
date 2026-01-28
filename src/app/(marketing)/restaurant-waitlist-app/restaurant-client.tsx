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
import type { RestaurantPageQuery, RestaurantPageSections } from "../../../../tina/__generated__/types";
import { FAQSection } from "@/components/sections/faq-section";
import { GlobalCTA } from "@/components/sections/global-cta";
import { IntroSection } from "@/components/sections/intro-section";
import { ArrowLink } from "@/components/sections/arrow-link";
import { BentoGrid } from "@/components/sections/bento-grid";
import { IconCards } from "@/components/sections/icon-cards";

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

interface RestaurantClientProps {
  query: string;
  variables: Record<string, unknown>;
  data: RestaurantPageQuery;
}

export function RestaurantClient(props: RestaurantClientProps) {
  const { data } = useTina(props);
  const page = data.restaurantPage;

  return (
    <main>
      {/* Hero Section - Same style as homepage */}
      <section className="relative overflow-hidden pt-32 lg:pt-48 pb-12 -mt-20 bg-foreground">
        <div className="relative mx-auto max-w-[1200px] px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-primary">
              {page.hero?.title}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-background/80 max-w-3xl mx-auto">
              {page.hero?.subtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {page.hero?.primaryCta && (
                <Button asChild size="lg" className="px-8">
                  <Link href={page.hero?.primaryCtaLink || "/signup"}>{page.hero.primaryCta}</Link>
                </Button>
              )}
              {page.hero?.secondaryCta && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="px-8 border-background/30 text-background bg-background/5 hover:bg-background/10 hover:text-background"
                >
                  <Link href={page.hero?.secondaryCtaLink || "/pricing"}>{page.hero.secondaryCta}</Link>
                </Button>
              )}
            </div>
            {/* Trust message */}
            {page.hero?.trustMessage && (
              <p className="mt-6 text-sm text-background/60">
                {page.hero.trustMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      {page.sections?.map((section, index) => {
        if (!section) return null;

        switch (section.__typename) {
          case "RestaurantPageSectionsIntroSection":
            return (
              <IntroSection
                key={index}
                title={section.title || ""}
                description={section.description || ""}
                image={section.image || undefined}
              />
            );

          case "RestaurantPageSectionsIconCards":
            return (
              <IconCards
                key={index}
                title={section.title || ""}
                items={(section.items || []).map(item => ({
                  title: item?.title || "",
                  description: item?.description || "",
                  icon: item?.icon || undefined,
                }))}
              />
            );

          case "RestaurantPageSectionsStepsSection":
            return (
              <section key={index} className="py-16">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-12">
                    {section.title}
                  </h2>

                  <div className="space-y-16">
                    {section.steps?.map((step, stepIndex) => {
                      if (!step) return null;
                      return (
                        <div key={stepIndex} className="grid lg:grid-cols-2 gap-8 items-center">
                          {/* Content */}
                          <div>
                            {/* Step badge */}
                            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm mb-4">
                              Step {step.stepNumber || stepIndex + 1}
                            </div>

                            <h3 className="text-xl font-bold mb-4">{step.title}</h3>

                            {step.bullets && step.bullets.length > 0 && (
                              <ul className="space-y-3 mb-4">
                                {step.bullets.map((bullet, bulletIndex) => {
                                  if (!bullet) return null;
                                  return (
                                    <li key={bulletIndex} className="flex items-start gap-3">
                                      <span className="text-primary font-semibold mt-0.5 flex-shrink-0">
                                        <Check className="w-4 h-4" />
                                      </span>
                                      <span className="text-muted-foreground">{bullet.text}</span>
                                    </li>
                                  );
                                })}
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
                                  alt={step.title || ""}
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
                      );
                    })}
                  </div>
                </div>
              </section>
            );

          case "RestaurantPageSectionsBeforeAfterComparison":
            return (
              <section key={index} className="py-16">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                      {section.title}
                    </h2>
                    {section.subtitle && (
                      <p className="mt-2 text-muted-foreground">
                        {section.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Before Column */}
                    <div className="space-y-4">
                      <div className="rounded-xl bg-red-50 dark:bg-red-950/20 p-4">
                        <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">
                          {section.beforeTitle || "Before WaitQ"}
                        </h3>
                      </div>
                      {section.beforeItems?.map((item, itemIndex) => {
                        if (!item) return null;
                        const Icon = getIcon(item.icon);
                        return (
                          <div
                            key={itemIndex}
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
                          {section.afterTitle || "With WaitQ"}
                        </h3>
                      </div>
                      {section.afterItems?.map((item, itemIndex) => {
                        if (!item) return null;
                        const Icon = getIcon(item.icon);
                        return (
                          <div
                            key={itemIndex}
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
            );

          case "RestaurantPageSectionsBentoGrid":
            return (
              <BentoGrid
                key={index}
                title={section.title || ""}
                items={(section.items || []).map(item => ({
                  title: item?.title || "",
                  description: item?.description || "",
                  image: item?.image || undefined,
                }))}
              />
            );

          case "RestaurantPageSectionsFaq":
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

          case "RestaurantPageSectionsGlobalCta":
            return (
              <GlobalCTA
                key={index}
                title={section.title || ""}
                subtitle={section.subtitle || ""}
                primaryButtonText={section.primaryButtonText || ""}
                primaryButtonLink={section.primaryButtonLink || ""}
                secondaryButtonText={section.secondaryButtonText || undefined}
                secondaryButtonLink={section.secondaryButtonLink || undefined}
                trustMessage={section.trustMessage || undefined}
              />
            );

          default:
            return null;
        }
      })}
    </main>
  );
}
