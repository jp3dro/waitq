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
      <div className="flex-1">
        {children}
      </div>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10 text-sm text-muted-foreground grid gap-6 md:grid-cols-4">
          <div>
            <p className="font-semibold text-foreground">WaitQ</p>
            <p className="mt-2">© {new Date().getFullYear()} WaitQ</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Use cases</p>
            <ul className="mt-2 space-y-2">
              <li><Link href="/use-cases/restaurants" className="hover:text-foreground">Restaurants</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground">Company</p>
            <ul className="mt-2 space-y-2">
              <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground">Account</p>
            <ul className="mt-2 space-y-2">
              <li><Link href="/login" className="hover:text-foreground">Sign in</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}


