"use client";

import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";

interface IntroSectionProps {
  title: string;
  description: string;
  image?: string | null;
  imageOnRight?: boolean;
}

/**
 * Reusable two-column intro section with image and text.
 * Used as the first content section after hero on homepage and other pages.
 * Image is editable via TinaCMS.
 */
export function IntroSection({
  title,
  description,
  image,
  imageOnRight = false,
}: IntroSectionProps) {
  const imageContent = (
    <div className="relative">
      <div className="aspect-[4/3] bg-muted rounded-2xl shadow-xl overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <ImageIcon className="w-24 h-24 mx-auto text-muted-foreground/20" />
              <p className="mt-4 text-sm text-muted-foreground">Image placeholder</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const textContent = (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
      <p className="mt-4 text-lg text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <section className="pb-6 -mt-10">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {imageOnRight ? (
            <>
              {textContent}
              {imageContent}
            </>
          ) : (
            <>
              {imageContent}
              {textContent}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
