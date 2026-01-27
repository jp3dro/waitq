"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  title?: string;
  description?: string;
  image?: string;
  bullets?: string[];
}

interface TabbedContentProps {
  title?: string;
  subtitle?: string;
  tabs: Tab[];
  variant?: "pills" | "underline" | "buttons";
}

export function TabbedContent({
  title,
  subtitle,
  tabs,
  variant = "pills",
}: TabbedContentProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);
  const activeContent = tabs.find((tab) => tab.id === activeTab);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Tab buttons */}
        <div className="flex justify-center mb-8">
          <div
            className={cn(
              "inline-flex gap-2",
              variant === "pills" && "bg-muted rounded-full p-1",
              variant === "underline" && "border-b border-border",
              variant === "buttons" && "gap-4"
            )}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  variant === "pills" &&
                    (activeTab === tab.id
                      ? "bg-background rounded-full shadow-sm"
                      : "text-muted-foreground hover:text-foreground"),
                  variant === "underline" &&
                    (activeTab === tab.id
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"),
                  variant === "buttons" &&
                    (activeTab === tab.id
                      ? "bg-primary text-primary-foreground rounded-lg"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg")
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeContent && (
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {activeContent.title && (
                <h3 className="text-2xl font-bold mb-4">{activeContent.title}</h3>
              )}
              {activeContent.description && (
                <p className="text-muted-foreground mb-6">
                  {activeContent.description}
                </p>
              )}
              {activeContent.bullets && activeContent.bullets.length > 0 && (
                <ul className="space-y-3">
                  {activeContent.bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
              {activeContent.image ? (
                <Image
                  src={activeContent.image}
                  alt={activeContent.title || ""}
                  width={600}
                  height={450}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Screenshot preview
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
