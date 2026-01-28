"use client";

import Image from "next/image";
import { Image as ImageIcon, Check } from "lucide-react";
import { ArrowLink } from "./arrow-link";

interface StepBullet {
  text: string;
}

interface Step {
  stepNumber?: number;
  title: string;
  bullets?: StepBullet[];
  link?: string;
  linkText?: string;
  image?: string;
}

interface StepsSectionProps {
  title: string;
  steps: Step[];
}

/**
 * Steps section with numbered steps, bullet points, links, and images.
 * Each step has: number badge, title, bullets with Q icon, optional link, and image on right.
 */
export function StepsSection({ title, steps }: StepsSectionProps) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-12">
          {title}
        </h2>

        <div className="space-y-16">
          {steps.map((step, index) => (
            <div key={index} className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Content */}
              <div>
                {/* Step badge */}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm mb-4">
                  Step {step.stepNumber || index + 1}
                </div>

                <h3 className="text-xl font-bold mb-4">{step.title}</h3>

                {step.bullets && step.bullets.length > 0 && (
                  <ul className="space-y-3 mb-4">
                    {step.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="flex items-start gap-3">
                        <span className="text-primary font-semibold mt-0.5 flex-shrink-0">
                          <Check className="w-4 h-4" />
                        </span>
                        <span className="text-muted-foreground">{bullet.text}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {step.link && step.linkText && (
                  <ArrowLink href={step.link}>{step.linkText}</ArrowLink>
                )}
              </div>

              {/* Image */}
              <div className="relative">
                <div className="aspect-[4/3] bg-muted rounded-2xl shadow-lg overflow-hidden">
                  {step.image ? (
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-16 h-16 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
