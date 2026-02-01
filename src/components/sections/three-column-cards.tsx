"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { icons } from "lucide-react";

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
  const fallback = (icons as any).Users || (icons as any).CircleHelp || (icons as any).HelpCircle;
  const raw = typeof iconName === "string" ? iconName.trim() : "";
  if (!raw) return fallback;

  // Try direct name (case-sensitive)
  const direct = (icons as any)[raw];
  if (direct) return direct;

  // Try normalized PascalCase (supports "arrow-right", "arrow right", "arrow_right")
  const pascal = toPascalCase(raw);
  const byPascal = (icons as any)[pascal];
  if (byPascal) return byPascal;

  // Try case-insensitive match
  const lower = raw.toLowerCase();
  const key = Object.keys(icons).find((k) => k.toLowerCase() === lower);
  if (key) return (icons as any)[key];

  return fallback;
}

interface CardItem {
  title: string;
  description: string;
  icon?: string;
  image?: string;
  link?: string;
  linkText?: string;
}

interface ThreeColumnCardsProps {
  title?: string;
  subtitle?: string;
  items: CardItem[];
  variant?: "default" | "with-image" | "icon-only" | "numbered";
  columns?: 2 | 3;
}

export function ThreeColumnCards({
  title,
  subtitle,
  items,
  variant = "default",
  columns = 3,
}: ThreeColumnCardsProps) {
  const gridCols = columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3";

  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className={`grid ${gridCols} gap-8`}>
          {items.map((item, index) => {
            const Icon = getIcon(item.icon);

            if (variant === "with-image") {
              return (
                <div key={index} className="group">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-muted">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {item.description}
                  </p>
                  {item.link && item.linkText && (
                    <Button asChild variant="link" className="p-0 h-auto text-sm">
                      <Link href={item.link}>{item.linkText} &rarr;</Link>
                    </Button>
                  )}
                </div>
              );
            }

            if (variant === "icon-only") {
              return (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            }

            if (variant === "numbered") {
              return (
                <div key={index} className="relative pl-12">
                  <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            }

            // Default variant - card style
            return (
              <div
                key={index}
                className="rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                {item.image ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted mb-4">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                )}
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
                {item.link && item.linkText && (
                  <Button asChild variant="link" className="p-0 h-auto text-sm mt-3">
                    <Link href={item.link}>{item.linkText} &rarr;</Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
