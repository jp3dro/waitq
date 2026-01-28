"use client";

import {
  Users,
  Smartphone,
  MessageSquare,
  Clock,
  QrCode,
  Zap,
  Monitor,
  Heart,
  BarChart3,
  AlertCircle,
  Check,
} from "lucide-react";

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Smartphone,
  MessageSquare,
  Clock,
  QrCode,
  Zap,
  Monitor,
  Heart,
  BarChart3,
  AlertCircle,
  Check,
};

function getIcon(iconName: string | null | undefined) {
  if (!iconName) return AlertCircle;
  return iconMap[iconName] || AlertCircle;
}

interface IconCardItem {
  title: string;
  description: string;
  icon?: string;
}

interface IconCardsProps {
  title: string;
  items: IconCardItem[];
}

/**
 * Icon Cards Section - 3 column cards with icons, centered text.
 * Used for "How it works" style sections with icon-based cards.
 */
export function IconCards({ title, items }: IconCardsProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {title}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item, index) => {
            const Icon = getIcon(item.icon);
            return (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
