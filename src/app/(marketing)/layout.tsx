import Nav from "@/components/nav";
import Link from "next/link";
import Image from "next/image";
import { ContactModal } from "@/components/contact-modal";
import { Button } from "@/components/ui/button";
import { getGlobalSettings } from "@/lib/tina";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch footer data from TinaCMS
  let footerData = null;
  try {
    const { data } = await getGlobalSettings();
    footerData = data.global.footer;
  } catch {
    // Fallback to null if TinaCMS data unavailable
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      {/* Shared top navigation */}
      <Nav />
      {/* Add top padding to account for fixed header */}
      <div className="flex-1 pt-20">
        {children}
      </div>
      {/* CTA is now a per-page section component - add globalCta to page sections */}
      <footer className="bg-muted">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8 py-16">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-6 text-sm">
            <div className="md:col-span-3">
              <Link href="/" className="flex items-center mb-4" aria-label="WaitQ home">
                <Image src="/waitq.svg" alt="WaitQ" className="h-8 w-auto logo-light" width={108} height={32} />
                <Image src="/waitq-variant.svg" alt="WaitQ" className="h-8 w-auto logo-dark" width={108} height={32} />
              </Link>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                {footerData?.description || "Modern virtual waitlist management for restaurants. Keep guests informed and reduce wait times."}
              </p>
              <p className="text-xs text-muted-foreground">
                {footerData?.copyright || `© ${new Date().getFullYear()} WaitQ Inc. All rights reserved.`}
              </p>
            </div>
            {/* Render columns from TinaCMS data */}
            {footerData?.columns?.map((column, colIndex) => (
              <div key={colIndex}>
                <p className="font-semibold text-foreground mb-3">{column?.title}</p>
                <ul className="space-y-2 text-muted-foreground">
                  {column?.links?.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      {link?.isContactModal ? (
                        <ContactModal>
                          <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground transition font-normal">
                            {link?.label}
                          </Button>
                        </ContactModal>
                      ) : (
                        <Link href={link?.href || "#"} className="hover:text-foreground transition">
                          {link?.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {/* Fallback if no TinaCMS data */}
            {(!footerData?.columns || footerData.columns.length === 0) && (
              <>
                <div>
                  <p className="font-semibold text-foreground mb-3">Features</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><Link href="/features/self-check-in" className="hover:text-foreground transition">Self Check-in</Link></li>
                    <li><Link href="/features/virtual-waitlist" className="hover:text-foreground transition">Virtual Waitlist</Link></li>
                    <li><Link href="/features/virtual-waiting-room" className="hover:text-foreground transition">Virtual Waiting Room</Link></li>
                    <li><Link href="/features/analytics" className="hover:text-foreground transition">Analytics</Link></li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-3">Platform</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><Link href="/about" className="hover:text-foreground transition">About</Link></li>
                    <li>
                      <ContactModal>
                        <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground transition font-normal">Contact</Button>
                      </ContactModal>
                    </li>
                    <li><Link href="/pricing" className="hover:text-foreground transition">Pricing</Link></li>
                    <li><Link href="/restaurant-waitlist-app" className="hover:text-foreground transition">WaitQ for Restaurants</Link></li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-3">Legal & Account</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><Link href="/terms-and-conditions" className="hover:text-foreground transition">Terms and Conditions</Link></li>
                    <li><Link href="/privacy-policy" className="hover:text-foreground transition">Privacy Policy</Link></li>
                    <li><Link href="/login" className="hover:text-foreground transition">Log in</Link></li>
                    <li><Link href="/signup" className="hover:text-foreground transition">Sign up</Link></li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
