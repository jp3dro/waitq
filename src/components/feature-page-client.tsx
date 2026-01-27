"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  Users, 
  Zap,
  Monitor,
  MapPin,
  Smartphone,
  BarChart3,
  Clock,
  QrCode,
  MonitorPlay,
  MousePointerClick,
  SlidersHorizontal,
  Image as ImageIcon,
  Link as LinkIcon,
  Tablet,
  Globe,
  Diamond,
  Heart,
  Minus,
} from "lucide-react";
import { ContactButton } from "@/components/contact-button";
import { useTina } from "tinacms/dist/react";
import type { 
  FeatureQuery,
  FeatureSectionsThreeColumnCards,
  FeatureSectionsTestimonialWithStats,
  FeatureSectionsStatsRow,
  FeatureSectionsHowItWorksSteps,
} from "../../tina/__generated__/types";
import { TestimonialWithStats } from "@/components/sections/testimonial-with-stats";
import { StatsRow } from "@/components/sections/stats-row";
import { FAQSection } from "@/components/sections/faq-section";
import { ArrowLink } from "@/components/sections/arrow-link";
import { GlobalCTA } from "@/components/sections/global-cta";
import { IntroSection } from "@/components/sections/intro-section";

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Zap,
  Monitor,
  MapPin,
  Smartphone,
  BarChart3,
  Clock,
  QrCode,
  MonitorPlay,
  MousePointerClick,
  SlidersHorizontal,
  Check,
  Link: LinkIcon,
  Tablet,
  Globe,
  Diamond,
  Heart,
  Minus,
};

function getIcon(iconName: string | null | undefined) {
  if (!iconName) return Users;
  return iconMap[iconName] || Users;
}

interface FeaturePageClientProps {
  query: string;
  variables: Record<string, unknown>;
  data: FeatureQuery;
}

export function FeaturePageClient(props: FeaturePageClientProps) {
  const { data } = useTina(props);
  const page = data.feature;

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background to-muted/20 pt-20 pb-16">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {page.hero?.title}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                {page.hero?.subtitle}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                  <Link href={page.hero?.primaryCtaLink || "/signup"}>{page.hero?.primaryCta}</Link>
                </Button>
                {page.hero?.secondaryCta && (
                  <ContactButton>{page.hero.secondaryCta}</ContactButton>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-muted rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
                {page.hero?.heroImage ? (
                  <Image src={page.hero.heroImage} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-24 h-24 text-muted-foreground/20" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      {page.sections?.map((section, index) => {
        if (!section) return null;
        
        switch (section.__typename) {
          case "FeatureSectionsTextWithImage": {
            const variant = section.variant || "default";
            const containerClass = variant === "muted-bg" 
              ? "rounded-3xl bg-muted/30 p-6 md:p-10" 
              : variant === "card"
              ? "rounded-3xl border border-border p-6 md:p-10"
              : "";
            
            return (
              <section key={index} className="py-12">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <div className={containerClass}>
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                      {!section.imageOnRight && (
                        <div className="relative">
                          <div className={`aspect-[4/3] rounded-2xl shadow-xl overflow-hidden ${
                            variant === "muted-bg" ? "bg-background" : "bg-muted"
                          }`}>
                            {section.image ? (
                              <Image src={section.image} alt="" fill className="object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <ImageIcon className="w-24 h-24 text-muted-foreground/20" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                          {section.title}
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                          {section.description}
                        </p>
                        {section.bullets && section.bullets.length > 0 && (
                          <ul className="mt-8 space-y-4">
                            {section.bullets.map((bullet, bulletIndex) => (
                              <li key={bulletIndex} className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{bullet?.text}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {section.imageOnRight && (
                        <div className="relative">
                          <div className={`aspect-[4/3] rounded-2xl shadow-xl overflow-hidden ${
                            variant === "muted-bg" ? "bg-background" : "bg-muted"
                          }`}>
                            {section.image ? (
                              <Image src={section.image} alt="" fill className="object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <ImageIcon className="w-24 h-24 text-muted-foreground/20" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          case "FeatureSectionsHowItWorks":
            return (
              <section key={index} className="py-16">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                      {section.title}
                    </h2>
                    {section.subtitle && (
                      <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-8">
                    {section.steps?.map((step, stepIndex) => {
                      const stepWithImage = step as FeatureSectionsHowItWorksSteps & { image?: string };
                      return (
                        <div key={stepIndex}>
                          <div className="aspect-[4/3] bg-muted rounded-xl shadow-lg overflow-hidden mb-6">
                            {stepWithImage?.image ? (
                              <Image 
                                src={stepWithImage.image} 
                                alt={step?.title || ""} 
                                width={400}
                                height={300}
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <ImageIcon className="w-20 h-20 text-muted-foreground/20" />
                              </div>
                            )}
                          </div>
                          <h3 className="text-xl font-semibold mb-2">{step?.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {step?.description}
                          </p>
                          {step?.link && step?.linkText && (
                            <ArrowLink href={step.link}>
                              {step.linkText}
                            </ArrowLink>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );

          case "FeatureSectionsThreeColumnCards": {
            const sectionData = section as FeatureSectionsThreeColumnCards;
            const columns = sectionData.columns || 3;
            const variant = sectionData.variant || "default";
            const gridCols = columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
            
            return (
              <section key={index} className="py-16">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  {(sectionData.title || sectionData.subtitle) && (
                    <div className="text-center mb-12">
                      {sectionData.title && (
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                          {sectionData.title}
                        </h2>
                      )}
                      {sectionData.subtitle && (
                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                          {sectionData.subtitle}
                        </p>
                      )}
                    </div>
                  )}

                  <div className={`grid ${gridCols} gap-8`}>
                    {sectionData.items?.filter(Boolean).map((item, itemIndex) => {
                      if (!item) return null;
                      const Icon = getIcon(item.icon);

                      if (variant === "with-image") {
                        return (
                          <div key={itemIndex} className="group">
                            <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-muted">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.title || ""}
                                  width={400}
                                  height={300}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-16 h-16 text-muted-foreground/20" />
                                </div>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {item.description}
                            </p>
                            {item.link && item.linkText && (
                              <ArrowLink href={item.link}>
                                {item.linkText}
                              </ArrowLink>
                            )}
                          </div>
                        );
                      }

                      // Default card variant
                      return (
                        <div
                          key={itemIndex}
                          className="rounded-xl border border-border bg-card p-6 shadow-sm"
                        >
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="font-semibold mb-2">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                          {item.link && item.linkText && (
                            <ArrowLink href={item.link} className="mt-3">
                              {item.linkText}
                            </ArrowLink>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          }

          case "FeatureSectionsFeatureGrid":
            return (
              <section key={index} className="py-20">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <div className="rounded-3xl bg-muted/30 p-6 md:p-10">
                    <div className="text-center mb-16">
                      <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        {section.title}
                      </h2>
                      {section.subtitle && (
                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                          {section.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {section.features?.map((feature, featureIndex) => {
                        const Icon = getIcon(feature?.icon);
                        return (
                          <div key={featureIndex} className="bg-background rounded-xl p-6 shadow-sm">
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                              <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold mb-2">{feature?.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {feature?.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            );

          case "FeatureSectionsTestimonialWithStats": {
            const sectionData = section as FeatureSectionsTestimonialWithStats;
            return (
              <TestimonialWithStats
                key={index}
                title={sectionData.title || undefined}
                quote={sectionData.quote || ""}
                author={sectionData.author || ""}
                role={sectionData.role || ""}
                image={sectionData.image || undefined}
                stats={(sectionData.stats || []).map(s => ({ value: s?.value || "", label: s?.label || "" }))}
              />
            );
          }

          case "FeatureSectionsStatsRow": {
            const sectionData = section as FeatureSectionsStatsRow;
            return (
              <StatsRow
                key={index}
                stats={(sectionData.stats || []).map(s => ({ value: s?.value || "", label: s?.label || "" }))}
                variant={(sectionData.variant as "default" | "light" | "bordered") || "default"}
              />
            );
          }

          case "FeatureSectionsSocialProof":
            return (
              <section key={index} className="py-20">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <div className="rounded-3xl bg-muted/30 p-6 md:p-10">
                    <div className="text-center mb-12">
                      <h2 className="text-3xl font-bold tracking-tight">{section.title}</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                      {section.stats?.map((stat, statIndex) => (
                        <div key={statIndex} className="text-center">
                          <p className="text-5xl font-bold">{stat?.value}</p>
                          <p className="mt-2 text-sm text-muted-foreground">{stat?.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );

          case "FeatureSectionsTestimonial":
            return (
              <section key={index} className="py-20">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-background rounded-xl p-8 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex-shrink-0" />
                        <div>
                          <p className="text-lg italic">
                            &ldquo;{section.quote}&rdquo;
                          </p>
                          <p className="mt-3 text-sm font-medium">
                            — {section.author}, {section.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );

          case "FeatureSectionsFaq":
            return (
              <FAQSection
                key={index}
                title={section.title || "Frequently asked questions"}
                items={section.items || []}
              />
            );

          default:
            return null;
        }
      })}
    </main>
  );
}
