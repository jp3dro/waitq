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
  Image as ImageIcon
} from "lucide-react";
import { ContactButton } from "@/components/contact-button";
import { useTina } from "tinacms/dist/react";
import type { FeatureQuery, FeatureSections } from "../../tina/__generated__/types";

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
                  <img src={page.hero.heroImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Smartphone className="w-24 h-24 text-muted-foreground/20" />
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
          case "FeatureSectionsTextWithImage":
            return (
              <section key={index} className="py-20">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <div className={`${section.imageOnRight ? "" : "rounded-3xl bg-muted/30 p-6 md:p-10"}`}>
                    <div className={`grid lg:grid-cols-2 gap-12 items-center ${section.imageOnRight ? "" : ""}`}>
                      {!section.imageOnRight && (
                        <div className="relative">
                          <div className="aspect-[4/3] bg-background rounded-2xl shadow-xl overflow-hidden flex items-center justify-center">
                            {section.image ? (
                              <img src={section.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-24 h-24 text-muted-foreground/20" />
                            )}
                          </div>
                        </div>
                      )}
                      <div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
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
                          <div className="aspect-[4/3] bg-muted rounded-2xl shadow-xl overflow-hidden flex items-center justify-center">
                            {section.image ? (
                              <img src={section.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-24 h-24 text-muted-foreground/20" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );

          case "FeatureSectionsHowItWorks":
            return (
              <section key={index} className="py-20">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
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
                  <div className="grid md:grid-cols-3 gap-8">
                    {section.steps?.map((step, stepIndex) => {
                      const Icon = getIcon(step?.icon);
                      return (
                        <div key={stepIndex} className="text-center">
                          <div className="aspect-[4/3] bg-muted rounded-xl shadow-lg overflow-hidden mb-6 flex items-center justify-center">
                            <Icon className="w-20 h-20 text-muted-foreground/20" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">{step?.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {step?.description}
                          </p>
                          {step?.link && step?.linkText && (
                            <Button asChild variant="link" className="mt-2">
                              <Link href={step.link}>{step.linkText} &rarr;</Link>
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );

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
              <section key={index} className="py-20">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <div className="mx-auto max-w-3xl rounded-3xl bg-muted/30 p-6 md:p-10">
                    <h2 className="text-3xl font-bold tracking-tight text-center mb-10">
                      {section.title}
                    </h2>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                      {section.items?.map((item, itemIndex) => (
                        <AccordionItem key={itemIndex} value={`item-${itemIndex}`} className="bg-background rounded-lg px-6 border-0">
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
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </main>
  );
}
