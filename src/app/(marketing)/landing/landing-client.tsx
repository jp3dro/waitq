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
import { GlobalCTA } from "@/components/sections/global-cta";
import { IntroSection } from "@/components/sections/intro-section";
import { ArrowLink } from "@/components/sections/arrow-link";
import { BentoGrid } from "@/components/sections/bento-grid";
import { IconCards } from "@/components/sections/icon-cards";
import { HowItWorksCards } from "@/components/sections/how-it-works-cards";
import { CTASection } from "@/components/cta-section";

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
      {page.sections?.map((section, index) => {
        if (!section) return null;

        const s = section as LandingPageSections;
        switch (s.__typename) {
          case "LandingPageSectionsIntroSection": {
            return (
              <IntroSection
                key={index}
                title={s.title || ""}
                description={s.description || ""}
                image={s.image || ""}
              />
            );
          }
          case "LandingPageSectionsIconCards": {
            return (
              <IconCards
                key={index}
                title={s.title || ""}
                items={(s.items || []).map((it) => ({
                  title: it?.title || "",
                  description: it?.description || "",
                  icon: it?.icon || undefined,
                }))}
              />
            );
          }
          case "LandingPageSectionsStepsSection": {
            // Local render for steps section (existing component lives in restaurant-client only).
            return (
              <section key={index} className="py-16">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <h2 className="text-2xl font-bold tracking-tight">{s.title}</h2>
                  <div className="mt-10 grid gap-8">
                    {(s.steps || []).map((step) => (
                      <div key={String(step?.stepNumber ?? Math.random())} className="rounded-2xl border border-border p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm text-muted-foreground">Step {step?.stepNumber ?? ""}</div>
                            <div className="mt-1 text-lg font-semibold">{step?.title}</div>
                          </div>
                          {step?.image ? (
                            <div className="relative h-20 w-32 overflow-hidden rounded-lg">
                              <Image src={step.image} alt="" fill className="object-cover" />
                            </div>
                          ) : null}
                        </div>
                        {step?.bullets?.length ? (
                          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                            {step.bullets.map((b, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                                <span>{b?.text}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {step?.link && step?.linkText ? (
                          <div className="mt-4">
                            <ArrowLink href={step.link}>{step.linkText}</ArrowLink>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }
          case "LandingPageSectionsBeforeAfterComparison": {
            // Keep using BentoGrid / etc; before/after is custom in old client; render a simple grid.
            return (
              <section key={index} className="py-16">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <div className="max-w-3xl">
                    <h2 className="text-2xl font-bold tracking-tight">{s.title}</h2>
                    {s.subtitle ? <p className="mt-3 text-muted-foreground">{s.subtitle}</p> : null}
                  </div>
                  <div className="mt-10 grid md:grid-cols-2 gap-6">
                    <div className="rounded-2xl border border-border p-6">
                      <div className="text-sm font-semibold">{s.beforeTitle || "Before"}</div>
                      <div className="mt-4 space-y-3">
                        {(s.beforeItems || []).map((it, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="mt-0.5">
                              {(() => {
                                const Icon = getIcon(it?.icon);
                                return <Icon className="h-4 w-4 text-muted-foreground" />;
                              })()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium">{it?.title}</div>
                              <div className="text-sm text-muted-foreground">{it?.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border p-6">
                      <div className="text-sm font-semibold">{s.afterTitle || "After"}</div>
                      <div className="mt-4 space-y-3">
                        {(s.afterItems || []).map((it, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="mt-0.5">
                              {(() => {
                                const Icon = getIcon(it?.icon);
                                return <Icon className="h-4 w-4 text-muted-foreground" />;
                              })()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium">{it?.title}</div>
                              <div className="text-sm text-muted-foreground">{it?.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }
          case "LandingPageSectionsBentoGrid": {
            return (
              <BentoGrid
                key={index}
                title={s.title || ""}
                items={(s.items || []).map((it) => ({
                  title: it?.title || "",
                  description: it?.description || "",
                  image: it?.image || "",
                }))}
              />
            );
          }
          case "LandingPageSectionsHowItWorksCards": {
            const how = s as unknown as {
              title?: string;
              subtitle?: string;
              columns?: number | null;
              items?: Array<{
                title?: string;
                description?: string;
                image?: string;
                link?: string;
                linkText?: string;
              } | null> | null;
            };
            return (
              <HowItWorksCards
                key={index}
                title={how.title || ""}
                subtitle={how.subtitle || undefined}
                columns={how.columns === 2 ? 2 : how.columns === 3 ? 3 : undefined}
                items={(how.items || []).map((it) => ({
                  title: it?.title || "",
                  description: it?.description || "",
                  image: it?.image || undefined,
                  link: it?.link || undefined,
                  linkText: it?.linkText || undefined,
                }))}
              />
            );
          }
          case "LandingPageSectionsFaq": {
            return (
              <FAQSection
                key={index}
                title={s.title || "FAQ"}
                items={(s.items || []).map((it) => ({
                  question: it?.question || "",
                  answer: it?.answer || "",
                }))}
              />
            );
          }
          case "LandingPageSectionsGlobalCta": {
            return (
              <GlobalCTA
                key={index}
                title={s.title || ""}
                subtitle={s.subtitle || ""}
                primaryButtonText={s.primaryButtonText || "Get started"}
                primaryButtonLink={s.primaryButtonLink || "/signup"}
                secondaryButtonText={s.secondaryButtonText || ""}
                secondaryButtonLink={s.secondaryButtonLink || ""}
                trustMessage={s.trustMessage || ""}
              />
            );
          }
          case "LandingPageSectionsCtaSection": {
            const cta = s as unknown as {
              variant?: "default" | "compact" | "inline" | string;
              title?: string;
              subtitle?: string;
              primaryButtonText?: string;
              primaryButtonLink?: string;
              secondaryButtonText?: string;
              secondaryButtonLink?: string;
              trustMessage?: string;
            };
            return (
              <section key={index} className="py-10">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <CTASection
                    variant={(cta.variant as "default" | "compact" | "inline") || "default"}
                    title={cta.title}
                    subtitle={cta.subtitle}
                    primaryButtonText={cta.primaryButtonText}
                    primaryButtonLink={cta.primaryButtonLink}
                    secondaryButtonText={cta.secondaryButtonText}
                    secondaryButtonLink={cta.secondaryButtonLink}
                    trustMessage={cta.trustMessage}
                  />
                </div>
              </section>
            );
          }
          default:
            return null;
        }
      })}
    </main>
  );
}

