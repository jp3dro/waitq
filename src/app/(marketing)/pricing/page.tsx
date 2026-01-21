import { Check, X } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { plans, pricingFeatures } from "@/lib/plans";

export const metadata = { 
  title: "Simple, transparent pricing | WaitQ",
  description: "WaitQ pays for itself with one recovered table a day. Start free, upgrade as you grow."
};

export default function PricingPage() {
  return (
    <main className="py-20">
      {/* Header */}
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Simple, transparent pricing</h1>
          <p className="text-xl text-muted-foreground max-w-[600px]">
            WaitQ pays for itself with one recovered table a day.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1100px] mx-auto mb-20">
        {/* Free Plan */}
        <div className="rounded-2xl border border-border bg-card p-8">
          <div>
            <h3 className="text-2xl font-bold">{plans.free.name}</h3>
            <p className="mt-2 text-muted-foreground">{plans.free.description}</p>
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl font-bold">€0</span>
            <span className="text-lg text-muted-foreground">/mo</span>
          </div>
          <ul className="mt-8 space-y-3">
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">{plans.free.limits.messagesPerMonth} SMS total</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">{plans.free.limits.locations} location</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">{plans.free.limits.users} user</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">Today analytics only</span>
            </li>
          </ul>
          <Button asChild className="w-full mt-8" variant="outline" size="lg">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>

        {/* Base Plan - Most Popular */}
        <div className="rounded-2xl border-2 border-primary bg-card p-8 relative shadow-lg">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-bold">{plans.base.name}</h3>
            <p className="mt-2 text-muted-foreground">{plans.base.description}</p>
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl font-bold">€{plans.base.priceMonthlyEUR}</span>
            <span className="text-lg text-muted-foreground">/mo</span>
          </div>
          <ul className="mt-8 space-y-3">
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">{plans.base.limits.messagesPerMonth} SMS / month</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">{plans.base.limits.locations} locations</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">{plans.base.limits.users} users</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">30-day analytics</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">Bidirectional SMS</span>
            </li>
          </ul>
          <Button asChild className="w-full mt-8" size="lg">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>

        {/* Premium Plan */}
        <div className="rounded-2xl border border-border bg-card p-8">
          <div>
            <h3 className="text-2xl font-bold">{plans.premium.name}</h3>
            <p className="mt-2 text-muted-foreground">{plans.premium.description}</p>
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl font-bold">€{plans.premium.priceMonthlyEUR}</span>
            <span className="text-lg text-muted-foreground">/mo</span>
          </div>
          <ul className="mt-8 space-y-3">
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">{plans.premium.limits.messagesPerMonth} SMS / month</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">{plans.premium.limits.locations} locations</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">{plans.premium.limits.users} users</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">30-day analytics</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">Priority support</span>
            </li>
          </ul>
          <Button asChild className="w-full mt-8" variant="outline" size="lg">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
      </div>

      {/* Feature Comparison Table */}
      <section className="py-12" id="features">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-10">
            Compare all features
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
                {Object.entries(
                  pricingFeatures.reduce((acc, feature) => {
                    if (!acc[feature.category]) {
                      acc[feature.category] = [];
                    }
                    acc[feature.category].push(feature);
                    return acc;
                  }, {} as Record<string, typeof pricingFeatures>)
                ).map(([category, features]) => (
                  <Fragment key={category}>
                    <tr className="border-t">
                      <td colSpan={4} className="py-4 px-4 font-semibold bg-muted/50">
                        {category}
                      </td>
                    </tr>
                    {features.map((feature) => (
                      <tr key={`${category}:${feature.name}`} className="border-b border-border/50">
                        <td className="py-3 px-4 text-sm">{feature.name}</td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.free === "boolean" ? (
                            feature.free ? (
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-muted-foreground">{feature.free}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.base === "boolean" ? (
                            feature.base ? (
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-muted-foreground">{feature.base}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.premium === "boolean" ? (
                            feature.premium ? (
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-muted-foreground">{feature.premium}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20" id="social-proof">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Trusted by top restaurants worldwide</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-5xl font-bold">85%</p>
              <p className="mt-2 text-sm text-muted-foreground">Reduction in perceived wait time</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold">2,000+</p>
              <p className="mt-2 text-sm text-muted-foreground">Restaurants using WaitQ</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold">4.8★</p>
              <p className="mt-2 text-sm text-muted-foreground">Average customer rating</p>
            </div>
          </div>
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-muted/50 rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex-shrink-0" />
                <div>
                  <p className="text-lg italic">
                    "Qminder cut our wait times by 35%. Guests love the SMS updates and our staff stays organized."
                  </p>
                  <p className="mt-3 text-sm font-medium">— Maria, GM at Bistro Verde</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl bg-muted/30 p-6 md:p-10">
            <h2 className="text-3xl font-bold tracking-tight text-center mb-10">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-background rounded-lg px-6 border-0">
              <AccordionTrigger className="text-left font-medium hover:no-underline">
                Can I use WaitQ for free?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Yes! We offer a free tier to get started. You can upgrade as your needs grow.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="bg-background rounded-lg px-6 border-0">
              <AccordionTrigger className="text-left font-medium hover:no-underline">
                Realistically, what is the expected ROI of WaitQ?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Most restaurants see ROI within the first month through increased table turnover and reduced walk-aways. With just one additional seated party per day, WaitQ pays for itself.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="bg-background rounded-lg px-6 border-0">
              <AccordionTrigger className="text-left font-medium hover:no-underline">
                Is billing based on each waitlist?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                No, billing is based on your plan tier. You can create unlimited waitlists within your plan limits.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="bg-background rounded-lg px-6 border-0">
              <AccordionTrigger className="text-left font-medium hover:no-underline">
                What are my payment options?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                We accept all major credit cards and can accommodate invoicing for annual plans.
              </AccordionContent>
            </AccordionItem>
            </Accordion>
          </div>
          </div>
        </div>
      </section>
    </main>
  );
}
