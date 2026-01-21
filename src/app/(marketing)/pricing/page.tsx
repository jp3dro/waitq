import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { 
  title: "Simple, transparent pricing | WaitQ",
  description: "WaitQ pays for itself with one recovered table a day. Start free, upgrade as you grow."
};

export default function PricingPage() {
  return (
    <main className="container mx-auto py-20 px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px]">
          WaitQ pays for itself with one recovered table a day.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
        {/* Starter Plan */}
        <div className="rounded-2xl border border-border bg-card p-8">
          <div>
            <h3 className="text-2xl font-bold">Starter</h3>
            <p className="mt-2 text-muted-foreground">Perfect for small restaurants</p>
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl font-bold">$19</span>
            <span className="text-lg text-muted-foreground">/mo</span>
          </div>
          <ul className="mt-8 space-y-3">
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">200 SMS / month</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">1 location</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">Real-time queue</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">Basic analytics</span>
            </li>
          </ul>
          <Button asChild className="w-full mt-8" variant="outline" size="lg">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>

        {/* Pro Plan - Most Popular */}
        <div className="rounded-2xl border-2 border-orange-500 bg-card p-8 relative shadow-lg">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-bold">Pro</h3>
            <p className="mt-2 text-muted-foreground">For busy restaurants</p>
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl font-bold">$49</span>
            <span className="text-lg text-muted-foreground">/mo</span>
          </div>
          <ul className="mt-8 space-y-3">
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">1,000 SMS / month</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">3 locations</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">Advanced analytics</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <span className="text-muted-foreground">Priority support</span>
            </li>
          </ul>
          <Button asChild className="w-full mt-8 bg-orange-500 hover:bg-orange-600 text-white" size="lg">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>

      <div className="text-center mb-20">
        <Button asChild variant="link">
          <Link href="#features">Compare all features &rarr;</Link>
        </Button>
      </div>

      {/* Social Proof */}
      <section className="py-20 border-t" id="features">
        <div className="max-w-7xl mx-auto">
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
      <section className="py-20 border-t bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            <details className="group bg-background rounded-lg p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Can I use WaitQ for free?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Yes! We offer a free tier to get started. You can upgrade as your needs grow.
              </p>
            </details>
            <details className="group bg-background rounded-lg p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Realistically, what is the expected ROI of WaitQ?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Most restaurants see ROI within the first month through increased table turnover and reduced walk-aways. With just one additional seated party per day, WaitQ pays for itself.
              </p>
            </details>
            <details className="group bg-background rounded-lg p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Is billing based on each waitlist?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                No, billing is based on your plan tier. You can create unlimited waitlists within your plan limits.
              </p>
            </details>
            <details className="group bg-background rounded-lg p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                What are my payment options?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                We accept all major credit cards and can accommodate invoicing for annual plans.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Smarter queue management starts here
          </h2>
          <p className="mt-4 text-lg opacity-90">
            Start your free trial today. No credit card required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/signup">Try Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
