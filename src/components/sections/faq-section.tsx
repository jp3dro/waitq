"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question?: string | null;
  answer?: string | null;
}

interface FAQSectionProps {
  title: string;
  items: (FAQItem | null)[];
}

/**
 * Reusable FAQ section with consistent design across all marketing pages.
 * Features a muted background container with rounded corners and card-style items.
 */
export function FAQSection({ title, items }: FAQSectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="py-8">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
          {title}
        </h2>
        <Accordion
          type="single"
          collapsible
          className="w-full space-y-4 bg-muted p-6 md:p-10 rounded-3xl"
        >
          {items.map((item, index) => {
            if (!item?.question) return null;
            return (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-lg px-6 border-0"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </section>
  );
}
