"use client";

import Image from "next/image";
import { Image as ImageIcon, Check } from "lucide-react";

interface BenefitBullet {
  text: string;
}

interface BenefitCard {
  badge?: string;
  title: string;
  image?: string;
  bullets?: BenefitBullet[];
}

interface TwoColumnBenefitsProps {
  title: string;
  subtitle?: string;
  cards: BenefitCard[];
}

/**
 * Two Column Benefits Section - Two big cards side by side with badges, images, and bullets.
 * Used for "Improve revenue, reviews, and repeat visits" style sections.
 */
export function TwoColumnBenefits({ title, subtitle, cards }: TwoColumnBenefitsProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <section className="py-8">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="rounded-3xl bg-muted dark:bg-muted/30 p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-6">
            {cards.slice(0, 2).map((card, index) => (
              <div key={index} className="bg-card rounded-2xl overflow-hidden shadow-sm">
                {/* Image with badge */}
                <div className="relative aspect-[16/10]">
                  {card.image ? (
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-muted-foreground/20" />
                    </div>
                  )}
                  {/* Badge */}
                  {card.badge && (
                    <div className="absolute top-4 left-4">
                      <span className="inline-block px-3 py-1 text-sm font-medium bg-white text-orange-700 rounded-full">
                        {card.badge}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4">{card.title}</h3>
                  {card.bullets && card.bullets.length > 0 && (
                    <ul className="space-y-3">
                      {card.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="flex items-start gap-3">
                          <span className="text-primary font-semibold mt-0.5 flex-shrink-0">
                            <Check className="w-4 h-4" />
                          </span>
                          <span className="text-md text-gray-700">
                            {bullet?.text}
                          </span>
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
  );
}
