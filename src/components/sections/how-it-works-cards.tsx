"use client";

import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { ArrowLink } from "./arrow-link";

interface HowItWorksItem {
  title: string;
  description: string;
  image?: string;
  link?: string;
  linkText?: string;
}

interface HowItWorksCardsProps {
  title: string;
  subtitle?: string;
  columns?: 2 | 3;
  items: HowItWorksItem[];
}

/**
 * How it works section with 3 cards, each with image, title, description, and optional link.
 * Image is shown FIRST, then title, description, and link below.
 * Link appears directly below the description text, not aligned to bottom.
 */
export function HowItWorksCards({ title, subtitle, columns, items }: HowItWorksCardsProps) {
  if (!items || items.length === 0) return null;

  const count = items.length;
  const requestedMax = columns === 2 ? 2 : 3;
  const maxCols = Math.min(requestedMax, count >= 3 ? 3 : count >= 2 ? 2 : 1);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={[
            "grid gap-8",
            maxCols >= 2 ? "md:grid-cols-2" : "",
            maxCols >= 3 ? "lg:grid-cols-3" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {items.map((item, index) => (
            <div key={index}>
              {/* Image */}
              <div className="aspect-[4/3] bg-background rounded-md overflow-hidden mb-4 shadow-sm">
                {item.image ? (
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
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>

              {/* Description */}
              <p className="text-md text-muted-foreground mb-3">
                {item.description}
              </p>

              {/* Link - directly below description, not aligned to bottom */}
              {item.link && item.linkText && (
                <ArrowLink href={item.link}>
                  {item.linkText}
                </ArrowLink>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
