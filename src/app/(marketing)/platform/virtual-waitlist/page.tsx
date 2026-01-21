import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Virtual Waitlist | WaitQ",
  description: "The virtual waitlist that keeps customers in the loop. Manage walk-ins, reservations, and SMS updates in one intuitive platform.",
};

export default function VirtualWaitlistPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background to-muted/20 pt-20 pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                The virtual waitlist that keeps customers in the loop
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Turn waitlists into warm welcomes. Manage walk-ins, reservations, and SMS updates in one intuitive platform designed for restaurants.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Link href="/signup">Try Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/contact">See how it works</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Trusted by 2,000+ restaurants
              </p>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-muted rounded-2xl shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent" />
                {/* Placeholder for phone mockup image */}
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-4 text-sm text-muted-foreground">Phone mockup placeholder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Better Guest Experience Section */}
      <section className="py-20 border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-[4/3] bg-muted rounded-2xl shadow-xl overflow-hidden">
                {/* Placeholder for restaurant image */}
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="mt-4 text-sm text-muted-foreground">Restaurant image placeholder</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Better guest experience, better reputation
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Keep customers informed with accurate wait times as public display or directly on their phone
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">Customers get honest wait times that update in real time</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">Anyone can check-in from their phone or kiosk</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">No app downloads required</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Manage Smart Queues Section */}
      <section className="py-20 border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Manage smart queues without the chaos
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Keep the front-of-house stress-free and organized. Know who's waiting and who's next in a glance.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">See who's waiting, and who's next in a glance</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">Send "table ready" texts and reduce walk-aways</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">Works on the devices you already have - no training nor hardware needed</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-muted rounded-2xl shadow-xl overflow-hidden">
                {/* Placeholder for phone mockup */}
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-4 text-sm text-muted-foreground">Phone mockup placeholder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Digital Waitlist Works */}
      <section className="py-20 border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              How our digital waitlist works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Self Check-in */}
            <div className="text-center">
              <div className="aspect-[4/3] bg-muted rounded-xl shadow-lg overflow-hidden mb-6">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Guests are added to the waitlist</h3>
              <p className="text-sm text-muted-foreground">
                Self check-in or host check-in: all it takes is a name and phone number or email.
              </p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/use-cases/restaurants">Read about self check-in &rarr;</Link>
              </Button>
            </div>

            {/* Virtual Waitlist */}
            <div className="text-center">
              <div className="aspect-[4/3] bg-muted rounded-xl shadow-lg overflow-hidden mb-6">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Full transparency for everyone</h3>
              <p className="text-sm text-muted-foreground">
                Anyone can see who's waiting, and who's next in a glance.
              </p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/use-cases/restaurants">Read about virtual waitlist &rarr;</Link>
              </Button>
            </div>

            {/* Seat with One Tap */}
            <div className="text-center">
              <div className="aspect-[4/3] bg-muted rounded-xl shadow-lg overflow-hidden mb-6">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Seat with one tap</h3>
              <p className="text-sm text-muted-foreground">
                When a table is ready, notify the guest and mark them as seated. Simple and fast.
              </p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/use-cases/restaurants">Read about waitlist &rarr;</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* All You Need Section */}
      <section className="py-20 border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              All you need to manage your waitlist
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Multiple Join Methods */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Multiple join methods</h3>
              <p className="text-sm text-muted-foreground">
                Self check-in, QR codes, email or SMS or host check-in. Make it easy for guests to join.
              </p>
            </div>

            {/* Real-Time Queue */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Real-Time Queue</h3>
              <p className="text-sm text-muted-foreground">
                See what's happening, who's next, and manage your entire waitlist in real-time.
              </p>
            </div>

            {/* Public Display */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Public Display</h3>
              <h3 className="font-semibold mb-2">Public Display</h3>
              <p className="text-sm text-muted-foreground">
                Show current wait times on a TV screen at your entrance or have guests track online.
              </p>
            </div>

            {/* Multi-Location */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Multi-Location</h3>
              <p className="text-sm text-muted-foreground">
                Manage multiple restaurant locations from a single dashboard.
              </p>
            </div>

            {/* Self-Service Kiosk */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Self-Service Kiosk</h3>
              <p className="text-sm text-muted-foreground">
                Let guests add themselves to the waitlist via tablet or QR code.
              </p>
            </div>

            {/* Analytics */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Analytics & Insights</h3>
              <p className="text-sm text-muted-foreground">
                Track peak hours, wait times, and customer patterns.
              </p>
            </div>

            {/* Accurate Wait Times */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Accurate Wait Times</h3>
              <p className="text-sm text-muted-foreground">
                Smart estimates based on real-time data and historical patterns.
              </p>
            </div>

            {/* Full control */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Full control</h3>
              <p className="text-sm text-muted-foreground">
                Optional gen-fencing or party size limits to prevent abuses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
          <div className="mt-12 max-w-3xl mx-auto">
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

      {/* FAQ Section */}
      <section className="py-20 border-t bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
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
                Most restaurants see ROI within the first month through increased table turnover and reduced walk-aways.
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

      {/* CTA Section */}
      <section className="py-20 border-t bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
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
