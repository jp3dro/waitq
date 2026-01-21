import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { 
  title: "WaitQ - The virtual waitlist that keeps guests from walking away",
  description: "Modern restaurant waitlist management software with SMS notifications. No app required. Manage queues, reduce wait times, and improve customer experience. Starting at $19/mo.",
};

export default function HomePage() {
  // FAQ structured data for rich snippets
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Do guests need an app?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Customers receive SMS text messages with a link to track their place in line. They can view their status from any web browser without downloading anything."
        }
      },
      {
        "@type": "Question",
        "name": "Does it work without WiFi integration?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. WaitQ works on any device with an internet connection. No special hardware or integration required."
        }
      },
      {
        "@type": "Question",
        "name": "Is billing based on each waitlist?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, billing is based on your plan tier. You can create unlimited waitlists within your plan limits."
        }
      },
      {
        "@type": "Question",
        "name": "What are my payment options?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We accept all major credit cards and can accommodate invoicing for annual plans."
        }
      }
    ]
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background via-background to-muted/30 mt-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utb3BhY2l0eT0iMC4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        <div className="relative mx-auto max-w-[1200px] px-6 lg:px-8 pt-24 pb-20">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              The virtual waitlist that keeps guests from walking away
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Turn waitlists into warm welcomes. Manage walk-ins, reservations, and SMS updates in one intuitive platform designed for restaurants.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="px-4">
                <Link href="/signup">Try for free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">See how it works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 border-t">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Stop losing revenue to long waits</h2>
            <p className="mt-2 text-lg text-muted-foreground">
            Badly managed restaurant queues lead to lost revenue in different ways.
            </p>
          </div>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="border border-border rounded-2xl p-6 text-left shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Front-door chaos</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Crowded lobbies make guests leave, causing you to lose potential revenue.
              </p>
            </div>
            <div className="border border-border rounded-2xl p-6 text-left shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Paper waitlists</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Clipboards don't work anymore. Guests expect text updates about their table.
              </p>
            </div>
            <div className="border border-border rounded-2xl p-6 text-left shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Poor guest experience</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep guests informed with accurate wait times and manage crowds effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Better Guest Impressions Section */}
      <section className="py-20 border-t bg-muted/30">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-[4/3] bg-background rounded-2xl shadow-xl overflow-hidden">
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
                Better guest first impressions
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Replace crowded entrances with calm, accurate updates, so guests don't walk away.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">Anyone can check-in to the waitlist from their phone or kiosk, no app downloads required</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">Keep customers informed with accurate wait times on public display or directly on their phones.</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">Customers get honest wait times that update in real time.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Handling Peak Hours Section */}
      <section className="py-20 border-t">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Handling of peak hours with ease
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
              No mistakes, crossed-out names, or constant “how long?” interruptions.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">See who's waiting, and who's next in a glance.</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">Send "table ready" texts and reduce walk-aways.</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">Works on the devices you already have. No training nor additional hardware needed.</span>
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

      {/* Simple Powerful Solution Section */}
      <section className="py-20 border-t bg-muted/30">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Simple, powerful solution to let guests flow through
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Self Check-in */}
            <div>
              <div className="aspect-[4/3] bg-background rounded-xl shadow-lg overflow-hidden mb-6">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Self check-in</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Guests can check-in themselves by scanning a QR code, and enter their email or phone number to get alerts.
              </p>
              <Button asChild variant="link" className="p-0 h-auto text-sm">
                <Link href="/platform/virtual-waitlist">Read about self check-in &rarr;</Link>
              </Button>
            </div>

            {/* Virtual Waitlist */}
            <div>
              <div className="aspect-[4/3] bg-background rounded-xl shadow-lg overflow-hidden mb-6">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Virtual waitlist</h3>
              <p className="text-sm text-muted-foreground mb-3">
                From the queue the customers wait times are updated on their devices and on kiosks.
              </p>
              <Button asChild variant="link" className="p-0 h-auto text-sm">
                <Link href="/platform/virtual-waitlist">Read about virtual waitlist &rarr;</Link>
              </Button>
            </div>

            {/* Virtual waiting room */}
            <div>
              <div className="aspect-[4/3] bg-background rounded-xl shadow-lg overflow-hidden mb-6">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Virtual waiting room</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Keep guests waiting comfortably and in control, without crowding the entrance.
              </p>
              <Button asChild variant="link" className="p-0 h-auto text-sm">
                <Link href="/platform/virtual-waitlist">Read about virtual waiting room &rarr;</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Better Guest Impressions Section */}
      <section className="py-20 border-t bg-muted/30">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-[4/3] bg-background rounded-2xl shadow-xl overflow-hidden">
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
                Rich analytics that improve your business.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Track the few metrics that actually move revenue and guest experience, then adjust staffing, pacing, and guest messaging based on real data, not gut feel.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">Track peak hours and average wait time, so you staff smarter.</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">Get accurate wait times and trends, so the experience stays predictable.</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-muted-foreground">Gather customer data for marketing campaigns.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* With All Features Section */}
      <section className="py-20 border-t">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              With all the features your restaurant needs
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Multiple Join Methods */}
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">SMS or E-mail notifications</h3>
              <p className="text-sm text-muted-foreground">
                Automatic text messages keep guests informed. No app downloads required.
              </p>
            </div>

            {/* Real-Time Queue */}
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Real-Time Queue</h3>
              <p className="text-sm text-muted-foreground">
                See what's happening, who's next, and manage in real-time.
              </p>
            </div>

            {/* Public Display */}
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Virtual Waiting Room</h3>
              <p className="text-sm text-muted-foreground">
                Guests see their position in the waitlist with estimated wait times.
              </p>
            </div>

            {/* Multi-Location */}
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Multi-Location</h3>
              <p className="text-sm text-muted-foreground">
                Manage multiple restaurant locations from a single dashboard.
              </p>
            </div>

            {/* SMS Notifications */}
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Public Display</h3>
              <p className="text-sm text-muted-foreground">
                Show current wait times on a TV screen or tablet at your entrance.
              </p>
            </div>

            {/* Self-Service Kiosk */}
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Self-Service Kiosk</h3>
              <p className="text-sm text-muted-foreground">
                Let guests add themselves to the waitlist via tablet or QR code.
              </p>
            </div>

            {/* Analytics */}
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Analytics & Insights</h3>
              <p className="text-sm text-muted-foreground">
              Track peak hours, average wait times, and customer patterns.
              </p>
            </div>

            {/* Accurate Wait Times */}
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Accurate Wait Times</h3>
              <p className="text-sm text-muted-foreground">
                Smart estimates based on historical data and queue length. No more guessing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 border-t bg-muted/30">
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
            <div className="bg-background rounded-xl p-8 shadow-sm">
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
      <section className="py-20 border-t">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            <details className="group bg-card rounded-lg p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Do guests need an app?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                No. Customers receive SMS text messages with a link to track their place in line. They can view their status from any web browser without downloading anything.
              </p>
            </details>
            <details className="group bg-card rounded-lg p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Does it work without WiFi integration?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Yes. WaitQ works on any device with an internet connection. No special hardware or integration required.
              </p>
            </details>
            <details className="group bg-card rounded-lg p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Is billing based on each waitlist?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                No, billing is based on your plan tier. You can create unlimited waitlists within your plan limits.
              </p>
            </details>
            <details className="group bg-card rounded-lg p-6">
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

      {/* Final CTA */}
      <section className="py-20 border-t bg-primary text-primary-foreground">
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
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 hover:bg-primary-foreground/10">
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
