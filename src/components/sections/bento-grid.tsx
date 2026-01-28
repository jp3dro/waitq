"use client";

import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";

interface BentoItem {
  title: string;
  description: string;
  image?: string;
}

interface BentoGridProps {
  title: string;
  items: BentoItem[];
}

/**
 * Bento box grid layout with 2 large cards (first row) and 3 smaller cards (second row).
 * Used for "How we turn waiting time into a competitive advantage" and similar sections.
 */
export function BentoGrid({ title, items }: BentoGridProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="py-8">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {title}
          </h2>
        </div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {/* First two items - Large cards (3 cols each) */}
          {items.slice(0, 2).map((item, index) => (
            <div
              key={index}
              className="md:col-span-3 rounded-2xl bg-orange-100 dark:bg-orange-400/10 p-6 flex flex-col"
            >
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-md text-muted-foreground mb-4">
                {item.description}
              </p>
              <div className="mt-auto aspect-[16/10] bg-muted rounded-xl overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={500}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Next three items - Small cards (2 cols each) */}
          {items.slice(2, 5).map((item, index) => (
            <div
              key={index + 2}
              className="md:col-span-2 rounded-2xl bg-orange-100 dark:bg-orange-400/10 p-5 flex flex-col"
            >
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-md text-muted-foreground mb-4">
                {item.description}
              </p>
              <div className="mt-auto aspect-[4/3] bg-muted rounded-xl overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={300}
                    height={225}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
