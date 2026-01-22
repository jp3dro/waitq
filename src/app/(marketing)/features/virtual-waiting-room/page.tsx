import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Monitor, MonitorPlay, Clock, Smartphone } from "lucide-react";

export const metadata = {
  title: "Virtual Waiting Room | WaitQ",
  description: "Public displays and status pages that keep guests informed. Real-time wait times on any screen.",
};

export default function VirtualWaitingRoomPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background to-muted/20 pt-20 pb-16">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Keep everyone in the loop
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Show real-time wait times on public displays, TVs, or personal devices. Transparency builds trust and reduces anxiety.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                  <Link href="/signup">Try Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/contact">See how it works</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-muted rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
                <MonitorPlay className="w-48 h-48 text-muted-foreground/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Display Section */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-[16/9] bg-background rounded-2xl shadow-xl overflow-hidden flex items-center justify-center border">
                <Monitor className="w-48 h-48 text-muted-foreground/10" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Public display mode
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Mount a TV or tablet at your entrance to show the current waitlist. Guests see their position and estimated wait time at a glance.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Real-time updates as the queue moves</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Clean, readable interface optimized for distance viewing</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Works on any screen with a web browser</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">No special hardware or software required</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Status Page Section */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="rounded-3xl bg-muted/30 p-6 md:p-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Personal status pages
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Each guest gets a unique link to track their position on their own device. They can wait anywhere—at a nearby café, in their car, or browsing local shops.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Live position tracking with estimated wait time</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">SMS and email notifications when their table is ready</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Guests can cancel their spot if plans change</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">No app download required—just a web link</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-[9/16] max-w-sm mx-auto bg-background rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center border-8 border-muted">
                <Smartphone className="w-32 h-32 text-muted-foreground/10" />
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Why transparency matters
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              When guests know where they stand, everyone wins
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="border border-border rounded-2xl p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reduced perceived wait time</h3>
              <p className="text-sm text-muted-foreground">
                Guests who can track their progress feel like they're waiting less, even if the actual time is the same.
              </p>
            </div>
            <div className="border border-border rounded-2xl p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MonitorPlay className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fewer "how long?" questions</h3>
              <p className="text-sm text-muted-foreground">
                When information is visible, your team spends less time fielding the same questions over and over.
              </p>
            </div>
            <div className="border border-border rounded-2xl p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Better guest experience</h3>
              <p className="text-sm text-muted-foreground">
                Clear communication builds trust. Guests are more patient when they know what to expect.
              </p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
