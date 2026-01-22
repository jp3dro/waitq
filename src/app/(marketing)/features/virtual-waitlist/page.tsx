import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BadgeCheck,
  Check,
  Users,
  Zap,
  Monitor,
  MapPin,
  Smartphone,
  BarChart3,
  Clock,
  SlidersHorizontal,
  QrCode,
  MousePointerClick,
  Image as ImageIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata = {
  title: "Virtual Waitlist | WaitQ",
  description: "The virtual waitlist that keeps customers in the loop. Manage walk-ins, reservations, and SMS updates in one intuitive platform.",
};

export default function VirtualWaitlistPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background to-muted/20 pt-20 pb-16">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                The virtual waitlist that keeps customers in the loop
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Turn waitlists into warm welcomes. Manage walk-ins, reservations, and SMS updates in one intuitive platform designed for restaurants.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                  <Link href="/signup">Try Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/contact">See how it works</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-primary" />
                Trusted by 2,000+ restaurants
              </p>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-muted rounded-2xl shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                {/* Placeholder for phone mockup image */}
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <Smartphone className="w-24 h-24 mx-auto text-muted-foreground/20" />
                    <p className="mt-4 text-sm text-muted-foreground">Phone mockup placeholder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Better Guest Experience Section */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-[4/3] bg-muted rounded-2xl shadow-xl overflow-hidden">
                {/* Placeholder for restaurant image */}
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <ImageIcon className="w-24 h-24 mx-auto text-muted-foreground/20" />
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
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Customers get honest wait times that update in real time</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Anyone can check-in from their phone or kiosk</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">No app downloads required</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Manage Smart Queues Section */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="rounded-3xl bg-muted/30 p-6 md:p-10">
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
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">See who's waiting, and who's next in a glance</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Send "table ready" texts and reduce walk-aways</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Works on the devices you already have - no training nor hardware needed</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-muted rounded-2xl shadow-xl overflow-hidden">
                {/* Placeholder for phone mockup */}
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <Smartphone className="w-24 h-24 mx-auto text-muted-foreground/20" />
                    <p className="mt-4 text-sm text-muted-foreground">Phone mockup placeholder</p>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Digital Waitlist Works */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
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
                    <QrCode className="w-20 h-20 mx-auto text-muted-foreground/20" />
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
                    <Users className="w-20 h-20 mx-auto text-muted-foreground/20" />
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
                    <MousePointerClick className="w-20 h-20 mx-auto text-muted-foreground/20" />
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
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="rounded-3xl bg-muted/30 p-6 md:p-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                All you need to manage your waitlist
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Multiple Join Methods */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Multiple join methods</h3>
              <p className="text-sm text-muted-foreground">
                Self check-in, QR codes, email or SMS or host check-in. Make it easy for guests to join.
              </p>
            </div>

            {/* Real-Time Queue */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Real-Time Queue</h3>
              <p className="text-sm text-muted-foreground">
                See what's happening, who's next, and manage your entire waitlist in real-time.
              </p>
            </div>

            {/* Public Display */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                <Monitor className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Public Display</h3>
              <p className="text-sm text-muted-foreground">
                Show current wait times on a TV screen at your entrance or have guests track online.
              </p>
            </div>

            {/* Multi-Location */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Multi-Location</h3>
              <p className="text-sm text-muted-foreground">
                Manage multiple restaurant locations from a single dashboard.
              </p>
            </div>

            {/* Self-Service Kiosk */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Self-Service Kiosk</h3>
              <p className="text-sm text-muted-foreground">
                Let guests add themselves to the waitlist via tablet or QR code.
              </p>
            </div>

            {/* Analytics */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Analytics & Insights</h3>
              <p className="text-sm text-muted-foreground">
                Track peak hours, wait times, and customer patterns.
              </p>
            </div>

            {/* Accurate Wait Times */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Accurate Wait Times</h3>
              <p className="text-sm text-muted-foreground">
                Smart estimates based on real-time data and historical patterns.
              </p>
            </div>

            {/* Full control */}
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Full control</h3>
              <p className="text-sm text-muted-foreground">
                Optional gen-fencing or party size limits to prevent abuses.
              </p>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="rounded-3xl bg-muted/30 p-6 md:p-10">
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
              <div className="bg-background rounded-xl p-8 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex-shrink-0" />
                  <div>
                    <p className="text-lg italic">
                      "WaitQ cut our wait times by 35%. Guests love the SMS updates and our staff stays organized."
                    </p>
                    <p className="mt-3 text-sm font-medium">— Maria, GM at Bistro Verde</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-3xl bg-muted/30 p-6 md:p-10">
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
                Most restaurants see ROI within the first month through increased table turnover and reduced walk-aways.
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
      </section>
    </main>
  );
}
