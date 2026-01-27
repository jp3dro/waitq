"use client";

import Image from "next/image";
import {
  Globe,
  MapPin,
  Heart,
  Image as ImageIcon,
} from "lucide-react";
import { useTina } from "tinacms/dist/react";
import type { AboutQuery } from "../../../../tina/__generated__/types";
import { StatsRow } from "@/components/sections/stats-row";

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

      {/* WaitQ started in 2026... */}
      <section className="py-16">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-[4/3] bg-muted rounded-2xl shadow-xl overflow-hidden">
                {page.intro?.image ? (
                  <Image
                    src={page.intro.image}
                    alt="WaitQ team"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-8">
                      <ImageIcon className="w-24 h-24 mx-auto text-muted-foreground/20" />
                      <p className="mt-4 text-sm text-muted-foreground">Restaurant image</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {page.intro?.title}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {page.intro?.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our mission */}
      <section className="py-16">
        <div className="mx-auto max-w-[900px] px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
            {page.mission?.title}
          </h2>
          <div className="space-y-6 text-muted-foreground">
            {page.mission?.paragraphs?.map((paragraph, index) => (
              <p key={index} className="text-lg leading-relaxed">
                {paragraph?.text}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Our guiding principles */}
      <section className="py-16">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-12">
            {page.principles?.title}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {page.principles?.items?.map((item, index) => (
              <div key={index}>
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

      {/* How we operate */}
      <section className="py-16">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {page.howWeOperate?.title}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {page.howWeOperate?.description}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {page.howWeOperate?.items?.map((item, index) => {
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
