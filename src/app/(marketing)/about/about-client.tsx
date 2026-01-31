"use client";

import { useTina } from "tinacms/dist/react";
import type { AboutQuery } from "../../../../tina/__generated__/types";
import { renderMarketingSection } from "@/components/marketing/marketing-section-renderer";

interface AboutClientProps {
  query: string;
  variables: Record<string, unknown>;
  data: AboutQuery;
}

export function AboutClient(props: AboutClientProps) {
  const { data } = useTina(props);
  const page = data.about;

  const sections = (page as unknown as { sections?: Array<Record<string, unknown> | null> }).sections || [];

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
      {sections.map((section, index) => renderMarketingSection(section, index))}
    </main>
  );
}
