"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ContactModal } from "@/components/contact-modal";

interface CTASectionProps {
  variant?: "default" | "compact" | "inline";
  className?: string;
}

export function CTASection({ variant = "default", className = "" }: CTASectionProps) {
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
              Smarter queue management starts here
            </h3>
            <p className="mt-1 text-sm sm:text-base opacity-90">
              Start your free trial today. No credit card required.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-end md:self-center">
            <Button asChild size="sm" variant="secondary" className="h-10 px-4">
              <Link href="/signup">Try for Free</Link>              
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
          <h3 className="text-xl font-bold">Smarter queue management starts here</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Start your free trial today. No credit card required.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <Link href="/signup">
              Try Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <ContactModal>
            <Button variant="outline">Contact Sales</Button>
          </ContactModal>
        </div>
      </div>
    );
  }

  return (
    <section className={`py-20 border-t bg-primary text-primary-foreground ${className}`}>
      <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Smarter queue management starts here
        </h2>
        <p className="mt-4 text-lg opacity-90">
          Start your free trial today. No credit card required.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" variant="secondary">
            <Link href="/signup">Try Free</Link>
          </Button>
          <ContactModal>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 hover:bg-primary-foreground/10">
              Contact Sales
            </Button>
          </ContactModal>
        </div>
      </div>
    </section>
  );
}
