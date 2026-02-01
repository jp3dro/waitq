import Image from "next/image";
import Link from "next/link";
import { Check, Image as ImageIcon, icons } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ArrowLink } from "@/components/sections/arrow-link";
import { FAQSection } from "@/components/sections/faq-section";
import { IntroSection } from "@/components/sections/intro-section";
import { HowItWorksCards } from "@/components/sections/how-it-works-cards";
import { ThreeColumnCards } from "@/components/sections/three-column-cards";
import { TwoColumnBenefits } from "@/components/sections/two-column-benefits";
import { ProductShowcase } from "@/components/sections/product-showcase";
import { BentoGrid } from "@/components/sections/bento-grid";
import { IconCards } from "@/components/sections/icon-cards";
import { StepsSection } from "@/components/sections/steps-section";
import { BeforeAfterComparison } from "@/components/sections/before-after-comparison";
import { TestimonialWithStats } from "@/components/sections/testimonial-with-stats";
import { FeatureComparison } from "@/components/sections/feature-comparison";
import { SocialProof } from "@/components/sections/social-proof";
import { CTASection } from "@/components/cta-section";

function toPascalCase(input: string) {
  return String(input || "")
    .trim()
    .replace(/[_\s-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function getIcon(iconName: string | null | undefined) {
  const fallback = (icons as any).Users || (icons as any).CircleAlert || (icons as any).Info || Object.values(icons as any)[0];
  const raw = typeof iconName === "string" ? iconName.trim() : "";
  if (!raw) return fallback;
  const direct = (icons as any)[raw];
  if (direct) return direct;
  const pascal = toPascalCase(raw);
  const byPascal = (icons as any)[pascal];
  if (byPascal) return byPascal;
  const lower = raw.toLowerCase();
  const key = Object.keys(icons).find((k) => k.toLowerCase() === lower);
  if (key) return (icons as any)[key];
  return fallback;
}

type UnknownSection = {
  __typename?: string;
  [key: string]: unknown;
};

function typeNameSuffix(t?: string) {
  if (!t) return "";
  const idx = t.lastIndexOf("Sections");
  return idx >= 0 ? t.slice(idx + "Sections".length) : t;
}

export function renderMarketingSection(section: unknown, key: React.Key) {
  const s = section as UnknownSection | null;
  if (!s || !s.__typename) return null;

  const suffix = typeNameSuffix(s.__typename);

  switch (suffix) {
    case "IntroSection": {
      const s = (section as unknown as { title?: string; description?: string; image?: string }) || {};
      return (
        <IntroSection
          key={key}
          title={s.title || ""}
          description={s.description || ""}
          image={s.image || undefined}
        />
      );
    }

    case "TextWithImage": {
      const s = section as unknown as {
        title?: string;
        description?: string;
        image?: string;
        imageOnRight?: boolean;
        variant?: "default" | "muted-bg" | "card" | string;
        bullets?: Array<{ text?: string; description?: string; icon?: string } | null> | null;
      };

      const variant = s.variant || "default";
      const containerClass =
        variant === "muted-bg"
          ? "rounded-3xl bg-muted p-6 md:p-10"
          : variant === "card"
            ? "rounded-3xl border border-border p-6 md:p-10"
            : "";

      return (
        <section key={key} className="py-4">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className={containerClass}>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                {!s.imageOnRight && (
                  <div className="relative">
                    <div
                      className={`aspect-[4/3] rounded-xl shadow-xl overflow-hidden ${
                        variant === "muted-bg" ? "bg-background" : "bg-muted"
                      }`}
                    >
                      {s.image ? (
                        <Image src={s.image} alt="" fill className="object-cover rounded-xl" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="w-24 h-24 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{s.title}</h2>
                  <p className="mt-4 text-lg text-muted-foreground">{s.description}</p>
                  {s.bullets && s.bullets.length > 0 ? (
                    <ul className="mt-8 space-y-4">
                      {s.bullets.map((bullet, bulletIndex) => {
                        const BulletIcon = bullet?.icon ? getIcon(bullet.icon) : Check;
                        return (
                          <li key={bulletIndex} className="flex items-start gap-3">
                            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <BulletIcon className="w-4 h-4 text-primary" />
                            </span>
                            <div className="min-w-0 pt-0.5">
                              <div className="text-foreground font-medium">{bullet?.text}</div>
                              {bullet?.description ? (
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {bullet.description}
                                </div>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>

                {s.imageOnRight && (
                  <div className="relative">
                    <div
                      className={`aspect-[4/3] rounded-2xl shadow-xl overflow-hidden ${
                        variant === "muted-bg" ? "bg-background" : "bg-muted"
                      }`}
                    >
                      {s.image ? (
                        <Image src={s.image} alt="" fill className="object-cover rounded-xl" />
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

    case "FeatureGrid": {
      const s = section as unknown as {
        title?: string;
        subtitle?: string;
        features?: Array<{ title?: string; description?: string; icon?: string } | null> | null;
      };

      return (
        <section key={key} className="py-20">
          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <div className="rounded-3xl bg-muted/30 p-6 md:p-10">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{s.title}</h2>
                {s.subtitle ? (
                  <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{s.subtitle}</p>
                ) : null}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {(s.features || []).map((feature, featureIndex) => {
                  const Icon = getIcon(feature?.icon);
                  return (
                    <div key={featureIndex} className="bg-background rounded-xl p-6 shadow-sm">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold mb-2">{feature?.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature?.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      );
    }

    case "HowItWorksTimeline": {
      const s = section as unknown as {
        title?: string;
        subtitle?: string;
        steps?: Array<{
          title?: string;
          description?: string;
          image?: string;
          link?: string;
          linkText?: string;
        } | null> | null;
      };

      return (
        <section key={key} className="py-16">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{s.title}</h2>
              {s.subtitle ? <p className="mt-4 text-lg text-muted-foreground">{s.subtitle}</p> : null}
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {(s.steps || []).map((step, stepIndex) => (
                <div key={stepIndex}>
                  <div className="aspect-[4/3] bg-muted rounded-md overflow-hidden mb-4 shadow-sm">
                    {step?.image ? (
                      <Image
                        src={step.image}
                        alt={step?.title || ""}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted/50">
                        <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step?.title}</h3>
                  <p className="text-md text-muted-foreground mb-3">{step?.description}</p>
                  {step?.link && step?.linkText ? <ArrowLink href={step.link}>{step.linkText}</ArrowLink> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "HowItWorksCards": {
      const s = section as unknown as {
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
          key={key}
          title={s.title || ""}
          subtitle={s.subtitle || undefined}
          columns={s.columns === 2 ? 2 : s.columns === 3 ? 3 : undefined}
          items={(s.items || []).map((it) => ({
            title: it?.title || "",
            description: it?.description || "",
            image: it?.image || undefined,
            link: it?.link || undefined,
            linkText: it?.linkText || undefined,
          }))}
        />
      );
    }

    case "ThreeColumnCards": {
      const s = section as unknown as {
        title?: string;
        subtitle?: string;
        variant?: "default" | "with-image" | "icon-only" | "numbered" | string;
        columns?: number | null;
        items?: Array<{
          title?: string;
          description?: string;
          icon?: string;
          image?: string;
          link?: string;
          linkText?: string;
        } | null> | null;
      };
      return (
        <ThreeColumnCards
          key={key}
          title={s.title || undefined}
          subtitle={s.subtitle || undefined}
          variant={(s.variant as any) || "default"}
          columns={s.columns === 2 ? 2 : 3}
          items={(s.items || []).map((it) => ({
            title: it?.title || "",
            description: it?.description || "",
            icon: it?.icon || undefined,
            image: it?.image || undefined,
            link: it?.link || undefined,
            linkText: it?.linkText || undefined,
          }))}
        />
      );
    }

    case "IconCards": {
      const s = section as unknown as {
        title?: string;
        items?: Array<{ title?: string; description?: string; icon?: string } | null> | null;
      };
      return (
        <IconCards
          key={key}
          title={s.title || ""}
          items={(s.items || []).map((it) => ({
            title: it?.title || "",
            description: it?.description || "",
            icon: it?.icon || undefined,
          }))}
        />
      );
    }

    case "StepsSection": {
      const s = section as unknown as {
        title?: string;
        steps?: Array<{
          stepNumber?: number | null;
          title?: string;
          bullets?: Array<{ text?: string } | null> | null;
          link?: string;
          linkText?: string;
          image?: string;
        } | null> | null;
      };
      return (
        <StepsSection
          key={key}
          title={s.title || ""}
          steps={(s.steps || []).map((st) => ({
            stepNumber: st?.stepNumber ?? undefined,
            title: st?.title || "",
            bullets: (st?.bullets || []).map((b) => ({ text: b?.text || "" })),
            link: st?.link || undefined,
            linkText: st?.linkText || undefined,
            image: st?.image || undefined,
          }))}
        />
      );
    }

    case "BeforeAfterComparison": {
      const s = section as unknown as {
        title?: string;
        subtitle?: string;
        beforeTitle?: string;
        afterTitle?: string;
        beforeItems?: Array<{ title?: string; description?: string; icon?: string } | null> | null;
        afterItems?: Array<{ title?: string; description?: string; icon?: string } | null> | null;
      };
      return (
        <BeforeAfterComparison
          key={key}
          title={s.title || ""}
          subtitle={s.subtitle || undefined}
          beforeTitle={s.beforeTitle || "Before"}
          afterTitle={s.afterTitle || "After"}
          beforeItems={(s.beforeItems || []).map((it) => ({
            title: it?.title || "",
            description: it?.description || "",
            icon: it?.icon || undefined,
          }))}
          afterItems={(s.afterItems || []).map((it) => ({
            title: it?.title || "",
            description: it?.description || "",
            icon: it?.icon || undefined,
          }))}
        />
      );
    }

    case "BentoGrid": {
      const s = section as unknown as {
        title?: string;
        items?: Array<{ title?: string; description?: string; image?: string } | null> | null;
      };
      return (
        <BentoGrid
          key={key}
          title={s.title || ""}
          items={(s.items || []).map((it) => ({
            title: it?.title || "",
            description: it?.description || "",
            image: it?.image || undefined,
          }))}
        />
      );
    }

    case "TwoColumnBenefits": {
      const s = section as unknown as {
        title?: string;
        subtitle?: string;
        cards?: Array<{
          badge?: string;
          title?: string;
          image?: string;
          bullets?: Array<{ text?: string } | null> | null;
        } | null> | null;
      };
      return (
        <TwoColumnBenefits
          key={key}
          title={s.title || ""}
          subtitle={s.subtitle || undefined}
          cards={(s.cards || []).map((c) => ({
            badge: c?.badge || undefined,
            title: c?.title || "",
            image: c?.image || undefined,
            bullets: (c?.bullets || []).map((b) => ({ text: b?.text || "" })),
          }))}
        />
      );
    }

    case "ProductShowcase": {
      const s = section as unknown as {
        title?: string;
        subtitle?: string;
        ctaText?: string;
        ctaLink?: string;
        cards?: Array<{ title?: string; description?: string; image?: string } | null> | null;
      };
      return (
        <ProductShowcase
          key={key}
          title={s.title || ""}
          subtitle={s.subtitle || undefined}
          ctaText={s.ctaText || undefined}
          ctaLink={s.ctaLink || undefined}
          cards={(s.cards || []).map((c) => ({
            title: c?.title || "",
            description: c?.description || "",
            image: c?.image || undefined,
          }))}
        />
      );
    }

    case "TestimonialWithStats": {
      const s = section as unknown as {
        title?: string;
        quote?: string;
        author?: string;
        role?: string;
        image?: string;
        stats?: Array<{ value?: string; label?: string } | null> | null;
      };
      return (
        <TestimonialWithStats
          key={key}
          title={s.title || undefined}
          quote={s.quote || ""}
          author={s.author || ""}
          role={s.role || ""}
          image={s.image || undefined}
          stats={(s.stats || []).map((st) => ({ value: st?.value || "", label: st?.label || "" }))}
        />
      );
    }

    case "Testimonial": {
      const s = section as unknown as { quote?: string; author?: string; role?: string; avatar?: string };
      return (
        <section key={key} className="py-16">
          <div className="mx-auto max-w-[900px] px-6 lg:px-8">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <p className="text-lg leading-relaxed">{s.quote}</p>
              <div className="mt-6 flex items-center gap-3">
                {s.avatar ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
                    <Image src={s.avatar} alt="" fill className="object-cover" />
                  </div>
                ) : null}
                <div className="text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">{s.author}</div>
                  {s.role ? <div>{s.role}</div> : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    case "SocialProof": {
      const s = section as unknown as {
        title?: string;
        stats?: Array<{ value?: string; label?: string } | null> | null;
        testimonial?: { quote?: string; author?: string; role?: string } | null;
      };
      return (
        <SocialProof
          key={key}
          title={s.title || ""}
          stats={s.stats}
          testimonial={s.testimonial || undefined}
        />
      );
    }

    case "FeatureComparison": {
      const s = section as unknown as {
        title?: string;
        categories?: Array<{
          name?: string;
          features?: Array<{ name?: string; free?: string; base?: string; premium?: string } | null> | null;
        } | null> | null;
      };
      return <FeatureComparison key={key} title={s.title || ""} categories={s.categories || []} />;
    }

    case "Faq": {
      const s = section as unknown as {
        title?: string;
        items?: Array<{ question?: string; answer?: string } | null> | null;
      };
      return (
        <FAQSection
          key={key}
          title={s.title || "Frequently asked questions"}
          items={(s.items || []).map((it) => ({ question: it?.question || "", answer: it?.answer || "" }))}
        />
      );
    }

    case "CtaSection": {
      const s = section as unknown as {
        variant?: "default" | "compact" | "inline" | string;
        title?: string;
        subtitle?: string;
        primaryButtonText?: string;
        primaryButtonLink?: string | null;
        secondaryButtonText?: string;
        secondaryButtonLink?: string | null;
        trustMessage?: string;
      };

      return (
        <section key={key} className="py-10">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <CTASection
              variant={(s.variant as "default" | "compact" | "inline") || "default"}
              title={s.title}
              subtitle={s.subtitle}
              primaryButtonText={s.primaryButtonText}
              primaryButtonLink={s.primaryButtonLink}
              secondaryButtonText={s.secondaryButtonText}
              secondaryButtonLink={s.secondaryButtonLink}
              trustMessage={s.trustMessage}
            />
          </div>
        </section>
      );
    }

    // ---- About-only layouts ----
    case "MissionSection": {
      const s = section as unknown as {
        title?: string;
        paragraphs?: Array<{ text?: string } | null> | null;
      };
      return (
        <section key={key} className="py-16">
          <div className="mx-auto max-w-[900px] px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">{s.title}</h2>
            <div className="space-y-6 text-muted-foreground">
              {(s.paragraphs || []).map((p, i) => (
                <p key={i} className="text-lg leading-relaxed">
                  {p?.text}
                </p>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "PrinciplesSection": {
      const s = section as unknown as {
        title?: string;
        items?: Array<{ title?: string; description?: string; image?: string } | null> | null;
      };
      return (
        <section key={key} className="py-16">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-12">{s.title}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {(s.items || []).map((it, i) => (
                <div key={i}>
                  <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-muted shadow-lg">
                    {it?.image ? (
                      <Image
                        src={it.image}
                        alt={it?.title || ""}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center p-8">
                          <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/20" />
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{it?.title}</h3>
                  <p className="text-sm text-muted-foreground">{it?.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "HowWeOperateSection": {
      const s = section as unknown as {
        title?: string;
        description?: string;
        items?: Array<{ title?: string; description?: string; icon?: string } | null> | null;
      };
      return (
        <section key={key} className="py-16">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{s.title}</h2>
              <p className="mt-4 text-lg text-muted-foreground">{s.description}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {(s.items || []).map((it, i) => {
                const Icon = getIcon(it?.icon);
                return (
                  <div key={i} className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{it?.title}</h3>
                    <p className="text-sm text-muted-foreground">{it?.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}

