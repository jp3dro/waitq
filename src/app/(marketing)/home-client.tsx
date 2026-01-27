"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Smartphone,
  Play,
  Monitor,
  Image as ImageIcon,
  ArrowUpRight,
  Check
} from "lucide-react";
import { YouTubeLightbox } from "@/components/youtube-lightbox";
import { useTina } from "tinacms/dist/react";
import type { HomeQuery } from "../../../tina/__generated__/types";

// Extended types for content sections not in TinaCMS schema
interface HowItWorksItem {
  title: string;
  description: string;
  image?: string;
  link?: string;
  linkText?: string;
}

interface BenefitSection {
  badge?: string;
  title: string;
  image?: string;
  bullets?: { text: string }[];
}

interface ProductCard {
  title: string;
  description: string;
  image?: string;
}

interface CompetitiveItem {
  title: string;
  description: string;
  image?: string;
}

interface StatItem {
  value: string;
  label: string;
}

interface HomeClientProps {
  query: string;
  variables: Record<string, unknown>;
  data: HomeQuery;
}

export function HomeClient(props: HomeClientProps) {
  const { data } = useTina(props);
  const page = data.home;

  // FAQ structured data for rich snippets
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": page.faq?.items?.map((item) => ({
      "@type": "Question",
      "name": item?.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item?.answer
      }
    })) || []
  };

  // Get content from JSON with fallbacks - cast to expected types
  const howItWorks = (page as unknown as { howItWorks?: { title: string; items: HowItWorksItem[] } }).howItWorks;
  const benefits = (page as unknown as { benefits?: { title: string; sections: BenefitSection[] } }).benefits;
  const productShowcase = (page as unknown as { productShowcase?: { title: string; subtitle?: string; ctaText?: string; ctaLink?: string; cards: ProductCard[] } }).productShowcase;
  const competitiveAdvantage = (page as unknown as { competitiveAdvantage?: { title: string; items: CompetitiveItem[] } }).competitiveAdvantage;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

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

      {/* Stop losing revenue Section */}
      <section className="pb-6 -mt-10">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-[4/3] bg-muted rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <ImageIcon className="w-24 h-24 mx-auto text-muted-foreground/20" />
                    <p className="mt-4 text-sm text-muted-foreground">Phone mockup with chat</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{page.problems?.title}</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {(page.problems as unknown as { description?: string })?.description || page.problems?.subtitle}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How WaitQ delivers a modern waiting experience */}
      {howItWorks && (
        <section className="py-16">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {howItWorks.title}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {howItWorks.items?.map((item, index) => (
                <div key={index} className="flex flex-col">
                  
                 
                  {/* Image */}
                  <div className="aspect-[4/3] bg-background rounded-md overflow-hidden mb-4 shadow-sm">
                    {item?.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted/50">
                        <div className="text-center p-6">
                          <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/30" />
                        </div>
                      </div>
                    )}
                  </div>

                   {/* Title */}
                   <h3 className="font-semibold text-lg mb-4">{item?.title}</h3>
                  
                  
                  {/* Description */}
                  <p className="text-md text-muted-foreground mb-4">
                    {item?.description}
                  </p>
                  
                  {/* Link */}
                  {item?.link && item?.linkText && (
                    <Link 
                      href={item.link}
                      className="inline-flex items-center gap-1 text-md font-medium text-foreground hover:text-primary transition-colors mt-auto group"
                    >
                      <span className="border-b border-foreground group-hover:border-primary">{item.linkText}</span>
                      <ArrowUpRight className="w-4 h-4 group-hover:text-primary group-hover:rotate-45 transition-transform" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Improve revenue, reviews Section - Two Big Cards Side by Side */}
      {benefits && (
        <section className="py-8">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {benefits.title}
              </h2>
            </div>
            <div className="rounded-3xl bg-muted dark:bg-muted/30 p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-6">
                {benefits.sections?.map((section, index) => (
                  <div key={index} className="bg-card rounded-2xl overflow-hidden shadow-sm">
                    {/* Image with badge */}
                    <div className="relative aspect-[16/10]">
                      {section.image ? (
                        <Image
                          src={section.image}
                          alt={section.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center">
                          <ImageIcon className="w-16 h-16 text-muted-foreground/20" />
                        </div>
                      )}
                      {/* Badge */}
                      {section.badge && (
                        <div className="absolute top-4 left-4">
                          <span className="inline-block px-3 py-1 text-sm font-medium bg-white text-orange-700 rounded-full">
                            {section.badge}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-4">{section.title}</h3>
                      {section.bullets && section.bullets.length > 0 && (
                        <ul className="space-y-3">
                          {section.bullets.map((bullet, bulletIndex) => (
                            <li key={bulletIndex} className="flex items-start gap-3">
                              <span className="text-primary font-semibold mt-0.5 flex-shrink-0 text-sm"><Check className="w-4 h-4" /></span>
                              <span className="text-sm text-muted-foreground">{bullet?.text}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modern, efficient waitlist management - Three Cards (No Tabs) */}
      {productShowcase && (
        <section className="py-16">
          
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            {/* Header with CTA */}
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
                {productShowcase.title}
              </h2>
            <div className="rounded-3xl bg-muted dark:bg-muted/30 p-6 md:p-10">
              <div className="mb-10">
                  {productShowcase.subtitle && (
                    <p className="text-xl font-semibold mb-2">
                      {productShowcase.subtitle}
                    </p>
                  )}
                  {productShowcase.ctaText && productShowcase.ctaLink && (
                    <Link 
                      href={productShowcase.ctaLink}
                      className="inline-flex items-center gap-1 text-foreground transition-colors hover:text-primary border-foreground text-md group group-hover:text-primary"
                    >
                      <span className="border-b border-foreground group-hover:border-primary">{productShowcase.ctaText}</span>
                      <ArrowUpRight className="w-4 h-4 group-hover:text-primary group-hover:rotate-45 transition-transform" />
                    </Link>
                  )}
              </div>

              {/* Three cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {productShowcase.cards?.map((card, index) => (
                  <div key={index} className="bg-background rounded-xl overflow-hidden">
                    {/* Image */}
                    <div className="aspect-[4/3] p-4 overflow-hidden">
                      {card.image ? (
                        <Image
                          src={card.image}
                          alt={card.title}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center p-6">
                            <Monitor className="w-16 h-16 mx-auto text-muted-foreground/20" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="pl-5 pr-5 pb-5">
                      <h3 className="font-semibold mb-2">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {card.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How we turn waiting time into a competitive advantage - Bento Box */}
      {competitiveAdvantage && (
        <section className="py-8">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {competitiveAdvantage.title}
              </h2>
            </div>
            
            {/* Bento Box Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* First two items - Large cards (3 cols each) */}
              {competitiveAdvantage.items?.slice(0, 2).map((item, index) => (
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
              
              {/* Next three items - Small cards (2 cols each) */}
              {competitiveAdvantage.items?.slice(2, 5).map((item, index) => (
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
      <section className="py-8">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
            {page.faq?.title}
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-4 bg-muted p-6 md:p-10 rounded-3xl">
            {page.faq?.items?.map((item, index) => (
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
    </main>
  );
}
