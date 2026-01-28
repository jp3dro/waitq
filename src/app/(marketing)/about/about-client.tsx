"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  MapPin,
  Heart,
  Image as ImageIcon,
} from "lucide-react";
import { useTina } from "tinacms/dist/react";
import type { AboutQuery } from "../../../../tina/__generated__/types";
import { Button } from "@/components/ui/button";

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  MapPin,
  Heart,
};

function getIcon(iconName: string | null | undefined) {
  if (!iconName) return Globe;
  return iconMap[iconName] || Globe;
}

interface AboutClientProps {
  query: string;
  variables: Record<string, unknown>;
  data: AboutQuery;
}

export function AboutClient(props: AboutClientProps) {
  const { data } = useTina(props);
  const page = data.about;

  // Get sections from the new flexible sections array
  const sections = (page as unknown as { sections?: Array<{
    __typename?: string;
    title?: string;
    description?: string;
    image?: string;
    paragraphs?: Array<{ text?: string } | null> | null;
    items?: Array<{
      title?: string;
      description?: string;
      image?: string;
      icon?: string;
    } | null> | null;
    primaryButtonText?: string;
    primaryButtonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    subtitle?: string;
  }> }).sections || [];

  return (
    <main>
      {/* Hero Section with wavy background */}
      <section className="relative bg-gradient-to-b from-orange-50 via-orange-50/50 to-background dark:from-orange-950/20 dark:via-orange-950/10 dark:to-background pt-24 pb-20 overflow-hidden">
        {/* Wavy pattern overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23f97316' fill-opacity='0.1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat-x",
            backgroundSize: "100% 100%",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              {page.hero?.title}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              {page.hero?.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      {sections.map((section, index) => {
        if (!section) return null;

        switch (section.__typename) {
          case "AboutSectionsIntroSection":
            return (
              <section key={index} className="py-16">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="relative">
                      <div className="aspect-[4/3] bg-muted rounded-2xl shadow-xl overflow-hidden">
                        {section.image ? (
                          <Image
                            src={section.image}
                            alt={section.title || ""}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center p-8">
                              <ImageIcon className="w-24 h-24 mx-auto text-muted-foreground/20" />
                              <p className="mt-4 text-sm text-muted-foreground">Image</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                        {section.title}
                      </h2>
                      <p className="mt-4 text-lg text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            );

          case "AboutSectionsMissionSection":
            return (
              <section key={index} className="py-16">
                <div className="mx-auto max-w-[900px] px-6 lg:px-8">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
                    {section.title}
                  </h2>
                  <div className="space-y-6 text-muted-foreground">
                    {section.paragraphs?.map((paragraph, pIndex) => (
                      <p key={pIndex} className="text-lg leading-relaxed">
                        {paragraph?.text}
                      </p>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "AboutSectionsPrinciplesSection":
            return (
              <section key={index} className="py-16">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-12">
                    {section.title}
                  </h2>
                  <div className="grid md:grid-cols-3 gap-8">
                    {section.items?.map((item, iIndex) => (
                      <div key={iIndex}>
                        <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-muted shadow-lg">
                          {item?.image ? (
                            <Image
                              src={item.image}
                              alt={item?.title || ""}
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
                        <h3 className="text-lg font-semibold mb-2">{item?.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item?.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "AboutSectionsHowWeOperateSection":
            return (
              <section key={index} className="py-16">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <div className="max-w-3xl mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                      {section.title}
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-8">
                    {section.items?.map((item, iIndex) => {
                      const Icon = getIcon(item?.icon);
                      return (
                        <div key={iIndex} className="text-center">
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
            );

          case "AboutSectionsGlobalCta":
            return (
              <section key={index} className="py-6 bg-primary text-primary-foreground">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                        {section.title}
                      </h3>
                      <p className="mt-1 text-sm opacity-90">
                        {section.subtitle}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {section.primaryButtonText && section.primaryButtonLink && (
                        <Button asChild size="lg" variant="secondary">
                          <Link href={section.primaryButtonLink}>{section.primaryButtonText}</Link>
                        </Button>
                      )}
                      {section.secondaryButtonText && section.secondaryButtonLink && (
                        <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 hover:bg-primary-foreground/10">
                          <Link href={section.secondaryButtonLink}>{section.secondaryButtonText}</Link>
                        </Button>
                      )}
                    </div>
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
