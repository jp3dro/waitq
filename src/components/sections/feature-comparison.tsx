"use client";

import { Check, X } from "lucide-react";
import { Fragment } from "react";

interface Feature {
  name?: string | null;
  free?: string | null;
  base?: string | null;
  premium?: string | null;
}

interface Category {
  name?: string | null;
  features?: (Feature | null)[] | null;
}

interface FeatureComparisonProps {
  title: string;
  categories: (Category | null)[];
}

function renderValue(value: string | null | undefined) {
  if (!value) return <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />;
  if (value === "✓" || value.toLowerCase() === "true") {
    return <Check className="h-5 w-5 text-green-600 mx-auto" />;
  }
  if (value === "✗" || value.toLowerCase() === "false") {
    return <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />;
  }
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

/**
 * Feature Comparison Table - Shows feature availability across pricing plans
 */
export function FeatureComparison({ title, categories }: FeatureComparisonProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-12" id="features">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-10">
          {title}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold">Feature</th>
                <th className="text-center py-4 px-4 font-semibold">Free</th>
                <th className="text-center py-4 px-4 font-semibold">Base</th>
                <th className="text-center py-4 px-4 font-semibold">Premium</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, catIndex) => {
                if (!category) return null;
                return (
                  <Fragment key={catIndex}>
                    <tr className="border-t">
                      <td colSpan={4} className="py-4 px-4 font-semibold bg-muted/50">
                        {category.name}
                      </td>
                    </tr>
                    {category.features?.map((feature, featureIndex) => {
                      if (!feature) return null;
                      return (
                        <tr key={`${catIndex}-${featureIndex}`} className="border-b border-border/50">
                          <td className="py-3 px-4 text-sm">{feature.name}</td>
                          <td className="py-3 px-4 text-center">{renderValue(feature.free)}</td>
                          <td className="py-3 px-4 text-center">{renderValue(feature.base)}</td>
                          <td className="py-3 px-4 text-center">{renderValue(feature.premium)}</td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
