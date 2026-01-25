import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, QrCode, Smartphone, Users, Zap } from "lucide-react";
import { ContactButton } from "@/components/contact-button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Self Check-in",
  description: "Let guests join your waitlist with QR codes or kiosk check-in. No app downloads required.",
  openGraph: {
    title: "Self Check-in - WaitQ",
    description: "Let guests join your waitlist with QR codes or kiosk check-in. No app downloads required.",
    images: [{ url: "/og-self-check-in.png", width: 1200, height: 630, alt: "WaitQ Self Check-in" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Self Check-in - WaitQ",
    description: "Let guests join your waitlist with QR codes or kiosk check-in.",
    images: ["/og-self-check-in.png"],
  },
};

export default function SelfCheckInPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background to-muted/20 pt-20 pb-16">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Self check-in that works for everyone
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Reduce front-of-house congestion by letting guests join your waitlist themselves. Simple QR code scanning or kiosk check-in—no app downloads required.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                  <Link href="/signup">Try Free</Link>
                </Button>
                <ContactButton>See how it works</ContactButton>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-muted rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
                <QrCode className="w-48 h-48 text-muted-foreground/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              How self check-in works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Give guests control of their experience from the moment they arrive
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Scan QR code</h3>
              <p className="text-sm text-muted-foreground">
                Display a QR code at your entrance. Guests scan it with their phone camera—no app needed.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Enter details</h3>
              <p className="text-sm text-muted-foreground">
                Guests enter their name, party size, and contact info directly from their phone.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Get updates</h3>
              <p className="text-sm text-muted-foreground">
                Instant SMS or email updates keep them informed of their place in line.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="rounded-3xl bg-muted/30 p-6 md:p-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Less chaos at the front door
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Stop juggling clipboards and handling lines. Let guests add themselves while your team focuses on hospitality.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Reduce front-of-house congestion and confusion</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">No app downloads or account creation required</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Works on any smartphone with a camera</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Free up staff to deliver better service</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-background rounded-2xl shadow-xl overflow-hidden flex items-center justify-center">
                <Users className="w-48 h-48 text-muted-foreground/10" />
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kiosk Mode Section */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="aspect-[4/3] bg-muted rounded-2xl shadow-xl overflow-hidden flex items-center justify-center">
                <Smartphone className="w-48 h-48 text-muted-foreground/10" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Or use kiosk mode
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Set up a tablet at your entrance for guests who prefer a dedicated station. Same easy check-in, different approach.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Dedicated check-in station for walk-ins</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Works on any tablet—no special hardware needed</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Customizable with your restaurant branding</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
