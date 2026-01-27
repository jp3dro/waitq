"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { TestimonialWithStats } from "@/components/sections/testimonial-with-stats";
import { StatsRow } from "@/components/sections/stats-row";
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
  imageOnRight?: boolean;
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

interface StatItem {
  value: string;
  label: string;
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
    intro?: { title: string; description: string; imageOnRight?: boolean };
    howItWorks?: { title: string; items: HowItWorksItem[] };
    benefits?: { title: string; sections: BenefitSection[] };
    beforeAfter?: { title: string; tabs: BeforeAfterTab[] };
    whyLove?: { title: string; items: WhyLoveItem[] };
    testimonialWithStats?: { title: string; quote: string; author: string; role: string; stats: StatItem[] };
    faq?: { title: string; items: FAQItem[] };
    cta?: { title: string; subtitle: string; buttonText: string; buttonLink: string };
  };
  const extendedPage = page as unknown as ExtendedPage;
  const intro = extendedPage.intro;
  const howItWorks = extendedPage.howItWorks;
  const benefits = extendedPage.benefits;
  const beforeAfter = extendedPage.beforeAfter;
  const whyLove = extendedPage.whyLove;
  const testimonialWithStats = extendedPage.testimonialWithStats;
  const faq = extendedPage.faq;
  const cta = extendedPage.cta;

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background via-background to-muted/30 pt-24 pb-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              {page.hero?.title} <br />
              <span className="text-primary">{page.hero?.highlightedText}</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              {page.hero?.subtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link href={page.hero?.ctaLink || "/signup"}>{page.hero?.ctaText}</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {page.hero?.ctaSubtext}
            </p>
          </div>
        </div>
      </section>

      {/* Say goodbye to paper lists */}
      {intro && (
        <section className="py-16">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="aspect-[4/3] bg-muted rounded-2xl shadow-xl overflow-hidden">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-8">
                      <ImageIcon className="w-24 h-24 mx-auto text-muted-foreground/20" />
                      <p className="mt-4 text-sm text-muted-foreground">Restaurant image</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{intro.title}</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  {intro.description}
                </p>
              </div>
            </div>
          </div>
        </section>
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
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-8">
                        <Smartphone className="w-16 h-16 mx-auto text-muted-foreground/20" />
                      </div>
                    </div>
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

      {/* Testimonial with Stats */}
      {testimonialWithStats && (
        <TestimonialWithStats
          title={testimonialWithStats.title}
          quote={testimonialWithStats.quote}
          author={testimonialWithStats.author}
          role={testimonialWithStats.role}
          stats={testimonialWithStats.stats || []}
        />
      )}

      {/* FAQ */}
      {faq && (
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-center mb-10">
              {faq.title}
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faq.items?.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-card rounded-lg px-6 border-0">
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    {item?.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item?.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Every minute counts CTA */}
      {cta && (
        <section className="py-16">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {cta.title}
              </h2>
              <p className="mt-4 text-lg opacity-90">
                {cta.subtitle}
              </p>
              <div className="mt-8">
                <Button asChild size="lg" variant="secondary">
                  <Link href={cta.buttonLink || "/signup"}>{cta.buttonText}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Row */}
      <StatsRow
        stats={[
          { value: "85%", label: "Reduction in perceived wait time" },
          { value: "2,000+", label: "Restaurants using WaitQ" },
          { value: "4.8★", label: "Average customer rating" }
        ]}
        variant="bordered"
      />
    </main>
  );
}
