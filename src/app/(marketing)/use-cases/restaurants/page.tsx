import Link from "next/link";
import {
  MessageSquare,
  Users,
  Smartphone,
  Clock,
  CheckCircle2,
  Utensils,
  QrCode,
  LayoutGrid,
  TrendingUp,
  Ban
} from "lucide-react";

export const metadata = {
  title: "WaitQ for Restaurants | Smart Waitlist Management",
  description: "Maximize table turnover and improve customer satisfaction with the smartest waitlist app for restaurants."
};

export default function RestaurantsUseCase() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl md:text-6xl font-medium tracking-tight text-foreground">
            Manage your restaurant queue <br />
            <span className="text-muted-foreground">without the chaos</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
            Replace paper lists and expensive pagers. Improve customer experience, reduce walk-aways, and turn tables faster with WaitQ.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-black px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              Start free trial
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              Request demo
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required • Cancel anytime • 5-minute setup
          </p>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 border-t bg-neutral-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">The problems you may be facing</h2>
            <p className="mt-4 text-base text-muted-foreground">
              Reception chaos and undefined wait times lead to dissatisfied customers and lost revenue.
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="mt-3 font-medium text-sm">Crowded Entrances</p>
              <p className="mt-1 text-xs text-muted-foreground">Blocked pathways frustrate staff and guests.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
                <Ban className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="mt-3 font-medium text-sm">Walk-aways</p>
              <p className="mt-1 text-xs text-muted-foreground">Guests leave when they don't know the wait.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
                <Smartphone className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="mt-3 font-medium text-sm">Pager Costs</p>
              <p className="mt-1 text-xs text-muted-foreground">Expensive hardware that gets lost or broken.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="mt-3 font-medium text-sm">Staff Stress</p>
              <p className="mt-1 text-xs text-muted-foreground">Constant questions about "how much longer?"</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Feature: Simplicity */}
      <section className="py-20 border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <Utensils className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">Waitlist management made simple</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Say goodbye to messy handwriting and confused hosts. Our intuitive digital interface makes adding parties, estimating wait times, and seating guests a breeze.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Add guests in seconds with just a name and phone number",
                  "Accurate wait time estimates based on real data",
                  "Color-coded status for quick visual scanning",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-base text-muted-foreground">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl aspect-[4/3] flex items-center justify-center border text-muted-foreground">
              {/* Placeholder for Product UI */}
              <span className="text-sm font-medium">Product Interface Preview</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Feature: Communication (Alternating) */}
      <section className="py-20 border-t bg-neutral-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-last lg:order-first bg-white dark:bg-black rounded-xl aspect-[4/3] flex items-center justify-center border text-muted-foreground shadow-sm">
              {/* Placeholder for SMS UI */}
              <span className="text-sm font-medium">SMS Notification Preview</span>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 text-blue-600">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">Keep customers in the loop</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Reduce anxiety and give guests the freedom to wait from anywhere. Send automated SMS or WhatsApp notifications when tables are ready.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Two-way communication lets guests confirm or cancel",
                  "Send updates if wait times change",
                  "Customizable message templates",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-base text-muted-foreground">
                    <CheckCircle2 className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight">Everything you need to run smoothly</h2>
            <p className="mt-3 text-base text-muted-foreground">
              Powerful features designed specifically for high-volume restaurants
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-xl bg-card ring-1 ring-border p-6 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                <QrCode className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold">Self-Service Options</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Display a QR code so guests can join the waitlist from their own device, preventing overcrowding at the stand.
              </p>
            </div>

            <div className="rounded-xl bg-card ring-1 ring-border p-6 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                <LayoutGrid className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold">Table Management</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Visualize your floor plan and assign tables to waiting parties with a simple drag-and-drop interface.
              </p>
            </div>

            <div className="rounded-xl bg-card ring-1 ring-border p-6 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold">Analytics & Insights</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Track average wait times, busy hours, and party sizes to optimize your staffing and operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 border-t bg-neutral-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <figure className="mx-auto max-w-2xl text-center">
            <blockquote className="text-xl font-medium leading-8 text-foreground sm:text-2xl sm:leading-9">
              <p>
                “Since switching to WaitQ, our host stand chaos has disappeared. Customers love the text updates, and we are turning tables 15% faster because people are ready when we text them.”
              </p>
            </blockquote>
            <figcaption className="mt-6">
              <div className="font-semibold text-foreground">Sarah Jenkins</div>
              <div className="text-sm text-muted-foreground mt-1">Manager at The Local Grill</div>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 border-t bg-black dark:bg-white text-white dark:text-black">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Ready to upgrade your restaurant?
          </h2>
          <p className="mt-4 text-base md:text-lg opacity-90">
            Join hundreds of restaurants using WaitQ to deliver a better guest experience.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-white dark:bg-black px-6 py-3 text-sm font-medium text-black dark:text-white shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              Start free trial
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium ring-1 ring-inset ring-white/20 dark:ring-black/20 hover:bg-white/10 dark:hover:bg-black/10"
            >
              Contact sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
