"use client";

interface Stat {
  value: string;
  label: string;
}

interface StatsRowProps {
  stats: Stat[];
  variant?: "default" | "light" | "bordered";
}

export function StatsRow({ stats, variant = "default" }: StatsRowProps) {
  const bgClass =
    variant === "light"
      ? "bg-muted/30"
      : variant === "bordered"
      ? "border-t border-b border-border"
      : "bg-muted/50";

  return (
    <section className={`py-12 ${bgClass}`}>
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl md:text-4xl font-bold">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
