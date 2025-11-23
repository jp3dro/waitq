import Image from "next/image";

export const metadata = { 
  title: "Home",
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
        "name": "How long does it take to set up WaitQ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Most restaurants are up and running in under 5 minutes. Simply create an account, add your location, and start accepting guests. No hardware installation or technical expertise required."
        }
      },
      {
        "@type": "Question",
        "name": "Do my customers need to download an app?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Customers receive SMS text messages with a link to track their place in line. They can view their status from any web browser without downloading anything."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use WaitQ on multiple devices?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. WaitQ works on phones, tablets, and computers. Your entire team can access the waitlist simultaneously from any device with an internet connection."
        }
      },
      {
        "@type": "Question",
        "name": "Does WaitQ work for multiple restaurant locations?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. WaitQ supports unlimited locations on our Business plan. Manage all your restaurants from a single dashboard with location-specific analytics."
        }
      },
      {
        "@type": "Question",
        "name": "How are SMS messages charged?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "SMS messages are included in your plan. The Starter plan includes 200 SMS per month, and the Pro plan includes 1,000 SMS per month. Additional messages can be purchased as needed."
        }
      },
      {
        "@type": "Question",
        "name": "Can I customize the messages sent to customers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Messages automatically include your restaurant name, the customer's ticket number, and estimated wait time. You can also enable WhatsApp notifications for international customers."
        }
      },
      {
        "@type": "Question",
        "name": "What happens if a customer doesn't show up?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can mark guests as 'no-show' with one tap. WaitQ tracks no-show rates in your analytics to help you identify patterns and optimize your operations."
        }
      },
      {
        "@type": "Question",
        "name": "Can customers join the waitlist remotely?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Enable kiosk mode to let customers add themselves via a tablet at your entrance, or share a QR code for remote check-in before they arrive."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a free trial?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Start with our Starter plan at $19/mo with no credit card required. Cancel anytime with no long-term commitment."
        }
      },
      {
        "@type": "Question",
        "name": "What kind of analytics does WaitQ provide?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "WaitQ provides real-time analytics including average wait times, peak hours, customer volume, no-show rates, and hourly trends. All data is available in an easy-to-read dashboard."
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
      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-20 pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-serif text-4xl md:text-6xl font-medium tracking-tight">
              Restaurant Waitlist Management Made Simple
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground">
              Modern queue management software with SMS notifications. No app required, no hardware needed. 
              Perfect for busy restaurants looking to reduce wait times and improve customer experience.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="/login" 
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-black px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-neutral-800"
              >
                Start free trial
              </a>
              <a 
                href="/contact" 
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Request demo
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required • Cancel anytime • 5-minute setup
            </p>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 border-t bg-neutral-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Stop losing customers to long waits</h2>
            <p className="mt-4 text-base text-muted-foreground">
              Crowded lobbies, frustrated guests, and manual tracking are costing you money. 
              WaitQ helps restaurants manage queues efficiently, keep customers informed, and maximize table turnover.
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <p className="mt-3 font-medium text-sm">Crowded lobbies</p>
              <p className="mt-1 text-xs text-muted-foreground">Guests leave when they see the crowd</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <p className="mt-3 font-medium text-sm">Manual tracking</p>
              <p className="mt-1 text-xs text-muted-foreground">Paper lists and confusion at the host stand</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="mt-3 font-medium text-sm">Inaccurate wait times</p>
              <p className="mt-1 text-xs text-muted-foreground">Guests complain about misleading estimates</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="mt-3 font-medium text-sm">Lost revenue</p>
              <p className="mt-1 text-xs text-muted-foreground">Walk-aways mean empty tables</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-lg font-medium">WaitQ solves all of this with one simple platform</p>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-16 border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Everything you need for restaurant queue management</h2>
            <p className="mt-3 text-base text-muted-foreground">
              Powerful features designed specifically for restaurants
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl bg-card ring-1 ring-border p-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <p className="mt-4 font-medium">SMS Notifications</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Automatic text messages keep guests informed. No app downloads required.
              </p>
            </div>
            <div className="rounded-xl bg-card ring-1 ring-border p-6">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="mt-4 font-medium">Real-Time Queue</p>
              <p className="mt-2 text-sm text-muted-foreground">
                See who's waiting, who's next, and manage your entire waitlist in real-time.
              </p>
            </div>
            <div className="rounded-xl bg-card ring-1 ring-border p-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="mt-4 font-medium">Accurate Wait Times</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Smart estimates based on historical data and current queue length.
              </p>
            </div>
            <div className="rounded-xl bg-card ring-1 ring-border p-6">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <p className="mt-4 font-medium">Multi-Location</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage multiple restaurant locations from a single dashboard.
              </p>
            </div>
            <div className="rounded-xl bg-card ring-1 ring-border p-6">
              <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <p className="mt-4 font-medium">Public Display</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Show current wait times on a TV screen at your entrance.
              </p>
            </div>
            <div className="rounded-xl bg-card ring-1 ring-border p-6">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <p className="mt-4 font-medium">Self-Service Kiosk</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Let guests add themselves to the waitlist via tablet or QR code.
              </p>
            </div>
            <div className="rounded-xl bg-card ring-1 ring-border p-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <p className="mt-4 font-medium">Analytics & Insights</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Track peak hours, average wait times, and customer patterns.
              </p>
            </div>
            <div className="rounded-xl bg-card ring-1 ring-border p-6">
              <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              </div>
              <p className="mt-4 font-medium">Easy Setup</p>
              <p className="mt-2 text-sm text-muted-foreground">
                No hardware installation. Works on devices you already have.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 border-t bg-neutral-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-3 text-base text-muted-foreground">
              Get started in minutes with our simple 3-step process
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <h3 className="text-lg font-semibold">Add guests to the waitlist</h3>
              </div>
              <p className="mt-4 ml-16 text-sm text-muted-foreground">
                Your host adds walk-ins with their name and phone number. Takes just seconds per guest.
              </p>
            </div>
            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <h3 className="text-lg font-semibold">Guests get notified</h3>
              </div>
              <p className="mt-4 ml-16 text-sm text-muted-foreground">
                Automatic SMS with estimated wait time and a link to track their position in real-time.
              </p>
            </div>
            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <h3 className="text-lg font-semibold">Seat with one tap</h3>
              </div>
              <p className="mt-4 ml-16 text-sm text-muted-foreground">
                When a table is ready, notify the guest and mark them as seated. Simple and fast.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Average setup time: 5 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Benefits for Restaurants */}
      <section className="py-16 border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Proven results for restaurants</h2>
            <p className="mt-3 text-base text-muted-foreground">
              See the impact on your operations and bottom line
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-xl bg-card ring-1 ring-border">
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">-35%</p>
              <p className="mt-2 font-medium">Walk-aways</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Guests stay when they're informed
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-card ring-1 ring-border">
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">+20%</p>
              <p className="mt-2 font-medium">Table turnover</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Faster seating, more covers per night
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-card ring-1 ring-border">
              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">4.8★</p>
              <p className="mt-2 font-medium">Customer satisfaction</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Better experience = better reviews
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-card ring-1 ring-border">
              <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">-50%</p>
              <p className="mt-2 font-medium">Host workload</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Automation frees up your team
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Showcase */}
      <section className="py-16 border-t bg-neutral-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Built for every type of restaurant</h2>
            <p className="mt-3 text-base text-muted-foreground">
              From fine dining to fast-casual, WaitQ adapts to your needs
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <a href="/use-cases/restaurants" className="group block rounded-xl bg-card ring-1 ring-border p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
              </div>
              <p className="font-medium group-hover:text-primary transition">Fine Dining</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Elegant waitlist management for upscale restaurants
              </p>
            </a>
            <a href="/use-cases/restaurants" className="group block rounded-xl bg-card ring-1 ring-border p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <p className="font-medium group-hover:text-primary transition">Casual Dining</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Handle high volume with ease during peak hours
              </p>
            </a>
            <a href="/use-cases/restaurants" className="group block rounded-xl bg-card ring-1 ring-border p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              </div>
              <p className="font-medium group-hover:text-primary transition">Fast-Casual</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Quick service with accurate wait time estimates
              </p>
            </a>
            <a href="/use-cases/restaurants" className="group block rounded-xl bg-card ring-1 ring-border p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" /></svg>
              </div>
              <p className="font-medium group-hover:text-primary transition">Cafes & Brunch</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage weekend rushes without the chaos
              </p>
            </a>
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Also perfect for <a href="/use-cases/barber-shop" className="underline hover:text-foreground">barber shops</a>, 
              {" "}<a href="/use-cases/beauty-salons" className="underline hover:text-foreground">beauty salons</a>, 
              {" "}<a href="/use-cases/clinics-and-medical" className="underline hover:text-foreground">medical clinics</a>, and more
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 border-t bg-neutral-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-3 text-base text-muted-foreground">
              Plans that grow with your restaurant. No surprises, no hidden fees.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="rounded-xl bg-card ring-1 ring-border p-6">
              <h3 className="text-lg font-semibold">Starter</h3>
              <p className="mt-1 text-sm text-muted-foreground">Perfect for small restaurants</p>
              <p className="mt-4 text-3xl font-bold">$19<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <ul className="mt-6 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>200 SMS / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>1 location</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Real-time queue</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Basic analytics</span>
                </li>
              </ul>
              <a href="/login" className="mt-6 block w-full text-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                Get started
              </a>
            </div>
            <div className="relative rounded-xl bg-card ring-2 ring-primary p-6 shadow-lg">
              <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Most Popular
              </span>
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="mt-1 text-sm text-muted-foreground">For busy restaurants</p>
              <p className="mt-4 text-3xl font-bold">$49<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <ul className="mt-6 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>1,000 SMS / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>3 locations</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Priority support</span>
                </li>
              </ul>
              <a href="/login" className="mt-6 block w-full text-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                Get started
              </a>
            </div>
            <div className="rounded-xl bg-card ring-1 ring-border p-6">
              <h3 className="text-lg font-semibold">Business</h3>
              <p className="mt-1 text-sm text-muted-foreground">For restaurant chains</p>
              <p className="mt-4 text-3xl font-bold">Custom</p>
              <ul className="mt-6 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Unlimited SMS</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Unlimited locations</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Dedicated support</span>
                </li>
              </ul>
              <a href="/contact" className="mt-6 block w-full text-center rounded-md px-4 py-2 text-sm font-medium ring-1 ring-inset ring-border hover:bg-muted">
                Contact sales
              </a>
            </div>
          </div>
          <div className="mt-8 text-center">
            <a href="/pricing" className="inline-flex items-center text-sm font-medium hover:underline">
              Compare all features →
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-center">Frequently asked questions</h2>
          <div className="mt-10 divide-y rounded-xl bg-card ring-1 ring-border divide-border">
            <details className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                How long does it take to set up WaitQ?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Most restaurants are up and running in under 5 minutes. Simply create an account, add your location, and start accepting guests. No hardware installation or technical expertise required.
              </p>
            </details>
            <details className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Do my customers need to download an app?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                No. Customers receive SMS text messages with a link to track their place in line. They can view their status from any web browser without downloading anything.
              </p>
            </details>
            <details className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Can I use WaitQ on multiple devices?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Yes. WaitQ works on phones, tablets, and computers. Your entire team can access the waitlist simultaneously from any device with an internet connection.
              </p>
            </details>
            <details className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Does WaitQ work for multiple restaurant locations?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Absolutely. WaitQ supports unlimited locations on our Business plan. Manage all your restaurants from a single dashboard with location-specific analytics.
              </p>
            </details>
            <details className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                How are SMS messages charged?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                SMS messages are included in your plan. The Starter plan includes 200 SMS per month, and the Pro plan includes 1,000 SMS per month. Additional messages can be purchased as needed.
              </p>
            </details>
            <details className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Can I customize the messages sent to customers?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Yes. Messages automatically include your restaurant name, the customer's ticket number, and estimated wait time. You can also enable WhatsApp notifications for international customers.
              </p>
            </details>
            <details className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                What happens if a customer doesn't show up?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                You can mark guests as 'no-show' with one tap. WaitQ tracks no-show rates in your analytics to help you identify patterns and optimize your operations.
              </p>
            </details>
            <details className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Can customers join the waitlist remotely?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Yes. Enable kiosk mode to let customers add themselves via a tablet at your entrance, or share a QR code for remote check-in before they arrive.
              </p>
            </details>
            <details className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Is there a free trial?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Yes. Start with our Starter plan at $19/mo with no credit card required. Cancel anytime with no long-term commitment.
              </p>
            </details>
            <details className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                What kind of analytics does WaitQ provide?
                <span className="ml-2 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                WaitQ provides real-time analytics including average wait times, peak hours, customer volume, no-show rates, and hourly trends. All data is available in an easy-to-read dashboard.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 border-t bg-black dark:bg-white text-white dark:text-black">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Ready to transform your restaurant's waitlist?
          </h2>
            <p className="mt-4 text-base md:text-lg opacity-90">
              Join restaurants using WaitQ to reduce wait times, improve customer satisfaction, and increase revenue.
            </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="/login" 
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-white dark:bg-black px-6 py-3 text-sm font-medium text-black dark:text-white shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              Start free trial
            </a>
            <a 
              href="/contact" 
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium ring-1 ring-inset ring-white/20 dark:ring-black/20 hover:bg-white/10 dark:hover:bg-black/10"
            >
              Talk to sales
            </a>
          </div>
            <p className="mt-6 text-xs opacity-75">
              No credit card required • 5-minute setup • Cancel anytime
            </p>
        </div>
      </section>
    </main>
  );
}
