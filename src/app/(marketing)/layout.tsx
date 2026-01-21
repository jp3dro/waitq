import Nav from "@/components/nav";
import Link from "next/link";

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
      </div>
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8 py-12">
          <div className="grid gap-8 md:grid-cols-5 text-sm">
            <div>
              <p className="font-semibold text-foreground mb-3">WaitQ</p>
              <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Qminder Inc. All rights reserved.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Platform</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/platform/virtual-waitlist" className="hover:text-foreground transition">Virtual Waitlist</Link></li>
                <li><Link href="/use-cases/restaurants" className="hover:text-foreground transition">For Restaurants</Link></li>
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
              <p className="font-semibold text-foreground mb-3">Legal</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/terms" className="hover:text-foreground transition">Terms</Link></li>
                <li><Link href="/terms#privacy" className="hover:text-foreground transition">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Account</p>
              <ul className="space-y-2 text-muted-foreground">
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


