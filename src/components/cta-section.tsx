"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ContactModal } from "@/components/contact-modal";

interface CTASectionProps {
  variant?: "default" | "compact" | "inline";
  className?: string;
  // Global CTA props from TinaCMS
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string | null;
  secondaryButtonText?: string;
  secondaryButtonLink?: string | null;
  trustMessage?: string;
}

export function CTASection({ 
  variant = "default", 
  className = "",
  title = "Smarter queue management starts here",
  subtitle = "Start your free trial today. No credit card required.",
  primaryButtonText = "Try for Free",
  primaryButtonLink = "/signup",
  secondaryButtonText,
  secondaryButtonLink,
  trustMessage,
}: CTASectionProps) {
  const safePrimaryButtonLink =
    typeof primaryButtonLink === "string" && primaryButtonLink.trim().length > 0
      ? primaryButtonLink
      : "/signup";

  const safeSecondaryButtonLink =
    typeof secondaryButtonLink === "string" && secondaryButtonLink.trim().length > 0
      ? secondaryButtonLink
      : null;

  if (variant === "compact") {
    return (
      <section
        className={[
          "rounded-2xl border border-primary bg-primary text-primary-foreground shadow-md px-6 py-5",
          className,
        ].join(" ")}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col flex-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              {title}
            </h3>
            <p className="mt-1 text-sm sm:text-base opacity-90">
              {subtitle}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-end md:self-center">
            <Button asChild size="sm" variant="secondary" className="h-10 px-4">
              <Link href={safePrimaryButtonLink}>{primaryButtonText}</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-muted rounded-xl ${className}`}>
        <div className="flex-1">
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {subtitle}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <Link href={safePrimaryButtonLink}>
              {primaryButtonText} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          {secondaryButtonText && safeSecondaryButtonLink ? (
            <Button asChild variant="outline">
              <Link href={safeSecondaryButtonLink}>{secondaryButtonText}</Link>
            </Button>
          ) : (
            <ContactModal>
              <Button variant="outline">Contact Sales</Button>
            </ContactModal>
          )}
        </div>
      </div>
    );
  }

  // Default variant - full width banner
  return (
    <section className={`py-6 bg-primary text-primary-foreground ${className}`}>
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              {title}
            </h3>
            <p className="mt-1 text-sm opacity-90">
              {subtitle}
            </p>
            {trustMessage && (
              <p className="mt-2 text-xs opacity-70">{trustMessage}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href={safePrimaryButtonLink}>{primaryButtonText}</Link>
            </Button>
            {secondaryButtonText && safeSecondaryButtonLink && (
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 hover:bg-primary-foreground/10">
                <Link href={safeSecondaryButtonLink}>{secondaryButtonText}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
