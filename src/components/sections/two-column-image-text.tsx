"use client";

import Image from "next/image";
import { Check } from "lucide-react";

interface Bullet {
  text: string;
  icon?: string;
}

interface TwoColumnImageTextProps {
  title: string;
  description?: string;
  image?: string;
  imageOnRight?: boolean;
  bullets?: Bullet[];
  variant?: "default" | "muted-bg" | "card";
}

export function TwoColumnImageText({
  title,
  description,
  image,
  imageOnRight = true,
  bullets,
  variant = "default",
}: TwoColumnImageTextProps) {
  const containerClass =
    variant === "muted-bg"
      ? "rounded-3xl bg-muted/30 p-6 md:p-10"
      : variant === "card"
      ? "rounded-3xl border border-border p-6 md:p-10"
      : "";

  const imageContent = (
    <div className="relative">
      <div
        className={`aspect-[4/3] rounded-2xl overflow-hidden ${
          variant === "muted-bg" ? "bg-background shadow-xl" : "bg-muted shadow-lg"
        }`}
      >
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Screenshot placeholder
          </div>
        )}
      </div>
    </div>
  );

  const textContent = (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
      {description && (
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      )}
      {bullets && bullets.length > 0 && (
        <ul className="mt-8 space-y-4">
          {bullets.map((bullet, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{bullet.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <section className="py-12">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className={containerClass}>
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
      </div>
    </section>
  );
}
