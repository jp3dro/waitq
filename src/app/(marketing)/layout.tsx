import Nav from "@/components/nav";
import Link from "next/link";
import Image from "next/image";
import { CTASection } from "@/components/cta-section";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      {/* Shared top navigation */}
      <Nav />
      {/* Add top padding to account for fixed header */}
      <div className="flex-1 pt-20">
        {children}
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8 pb-8">
          <CTASection variant="compact" />
        </div>
      </div>
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8 py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6 text-sm">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center mb-4" aria-label="WaitQ home">
                <Image src="/waitq.svg" alt="WaitQ" className="h-8 w-auto logo-light" width={108} height={32} />
                <Image src="/waitq-variant.svg" alt="WaitQ" className="h-8 w-auto logo-dark" width={108} height={32} />
              </Link>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                Modern virtual waitlist management for restaurants. Keep guests informed and reduce wait times.
              </p>
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} WaitQ Inc. All rights reserved.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Platform</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/platform/self-check-in" className="hover:text-foreground transition">Self Check-in</Link></li>
                <li><Link href="/platform/virtual-waitlist" className="hover:text-foreground transition">Virtual Waitlist</Link></li>
                <li><Link href="/platform/virtual-waiting-room" className="hover:text-foreground transition">Virtual Waiting Room</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Use Cases</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/use-cases/restaurants" className="hover:text-foreground transition">Restaurants</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Company</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/pricing" className="hover:text-foreground transition">Pricing</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Legal & Account</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/terms" className="hover:text-foreground transition">Terms of Service</Link></li>
                <li><Link href="/terms#privacy" className="hover:text-foreground transition">Privacy Policy</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition">Log in</Link></li>
                <li><Link href="/signup" className="hover:text-foreground transition">Sign up</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


