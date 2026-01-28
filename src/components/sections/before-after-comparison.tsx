"use client";

import { 
  Users,
  Zap,
  Monitor,
  Smartphone,
  BarChart3,
  Clock,
  QrCode,
  Heart,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Zap,
  Monitor,
  Smartphone,
  BarChart3,
  Clock,
  QrCode,
  Heart,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
};

function getIcon(iconName: string | null | undefined) {
  if (!iconName) return AlertCircle;
  return iconMap[iconName] || AlertCircle;
}

interface ComparisonItem {
  title: string;
  description: string;
  icon?: string;
}

interface BeforeAfterComparisonProps {
  title: string;
  subtitle?: string;
  beforeTitle: string;
  afterTitle: string;
  beforeItems: ComparisonItem[];
  afterItems: ComparisonItem[];
}

/**
 * Side-by-side comparison component showing "Before" vs "After" cards.
 * Design: Two columns with colored headers (red/green) and icon cards below.
 */
export function BeforeAfterComparison({
  title,
  subtitle,
  beforeTitle,
  afterTitle,
  beforeItems,
  afterItems,
}: BeforeAfterComparisonProps) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Before Column */}
          <div className="space-y-4">
            <div className="rounded-xl bg-red-50 dark:bg-red-950/20 p-4">
              <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">
                {beforeTitle}
              </h3>
            </div>
            {beforeItems.map((item, index) => {
              const Icon = getIcon(item.icon);
              return (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* After Column */}
          <div className="space-y-4">
            <div className="rounded-xl bg-green-50 dark:bg-green-950/20 p-4">
              <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
                {afterTitle}
              </h3>
            </div>
            {afterItems.map((item, index) => {
              const Icon = getIcon(item.icon);
              return (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
