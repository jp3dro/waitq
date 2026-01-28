"use client";

interface Stat {
  value?: string | null;
  label?: string | null;
}

interface Testimonial {
  quote?: string | null;
  author?: string | null;
  role?: string | null;
}

interface SocialProofProps {
  title: string;
  stats?: (Stat | null)[] | null;
  testimonial?: Testimonial | null;
}

/**
 * Social Proof Section - Stats and testimonial
 */
export function SocialProof({ title, stats, testimonial }: SocialProofProps) {
  return (
    <section className="py-20" id="social-proof">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        </div>
        {stats && stats.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => {
              if (!stat) return null;
              return (
                <div key={index} className="text-center">
                  <p className="text-5xl font-bold">{stat.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        )}
        {testimonial && (
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-muted/50 rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex-shrink-0" />
                <div>
                  <p className="text-lg italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <p className="mt-3 text-sm font-medium">
                    — {testimonial.author}, {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
