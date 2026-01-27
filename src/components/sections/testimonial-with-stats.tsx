"use client";

import Image from "next/image";

interface Stat {
  value: string;
  label: string;
}

interface TestimonialWithStatsProps {
  title?: string;
  quote: string;
  author: string;
  role: string;
  stats: Stat[];
  image?: string;
}

export function TestimonialWithStats({
  title = "Trusted by top restaurants worldwide",
  quote,
  author,
  role,
  stats,
  image,
}: TestimonialWithStatsProps) {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="rounded-3xl bg-primary text-primary-foreground overflow-hidden">
          <div className="text-center pt-8 pb-4">
            <p className="text-sm font-medium opacity-90">{title}</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 px-6 md:px-10 pb-10">
            {/* Left side - Image and Quote */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-primary-foreground/10">
                {image ? (
                  <Image
                    src={image}
                    alt="Restaurant"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400/20 to-orange-600/20 flex items-center justify-center">
                    <div className="text-center p-8 text-primary-foreground/50">
                      Restaurant image
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <blockquote className="text-xl md:text-2xl font-medium leading-relaxed">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <p className="mt-4 text-sm opacity-80">
                  {author}, {role}
                </p>
              </div>
            </div>
            
            {/* Right side - Stats */}
            <div className="flex flex-col justify-center">
              <div className="space-y-8">
                {stats.map((stat, index) => (
                  <div key={index}>
                    <p className="text-4xl md:text-5xl font-bold">{stat.value}</p>
                    <p className="mt-1 text-sm opacity-80">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
