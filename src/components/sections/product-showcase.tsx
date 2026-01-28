"use client";

import Image from "next/image";
import { Monitor, Image as ImageIcon } from "lucide-react";
import { ArrowLink } from "./arrow-link";

interface ProductCard {
  title: string;
  description: string;
  image?: string;
}

interface ProductShowcaseProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  cards: ProductCard[];
}

/**
 * Product Showcase Section - Three cards in a muted container with optional CTA link.
 */
export function ProductShowcase({ title, subtitle, ctaText, ctaLink, cards }: ProductShowcaseProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
          {title}
        </h2>
        <div className="rounded-3xl bg-muted dark:bg-muted/30 p-6 md:p-10">
          <div className="mb-10">
            {subtitle && (
              <p className="text-xl font-semibold mb-2">
                {subtitle}
              </p>
            )}
            {ctaText && ctaLink && (
              <ArrowLink href={ctaLink}>
                {ctaText}
              </ArrowLink>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {cards.map((card, index) => (
              <div key={index} className="bg-background rounded-xl overflow-hidden">
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
  );
}
