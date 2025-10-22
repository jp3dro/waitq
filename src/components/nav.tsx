import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Image from "next/image";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-backdrop-filter:bg-background/70 bg-background/90 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8 min-w-0">
          <Link href="/" className="flex items-center" aria-label="WaitQ home">
            <Image src="/waitq.svg" alt="WaitQ" className="h-8 w-auto" width={108} height={32} />
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-foreground/80">
          <div className="relative group">
            <button className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-muted hover:text-foreground">Use cases
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
            </button>
            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto absolute left-0 mt-0 w-[280px] rounded-md border border-border bg-card text-card-foreground shadow-md">
              <ul className="py-2 text-sm">
                <li><Link className="block px-3 py-1.5 hover:bg-muted" href="/use-cases/barber-shop">Barber shops</Link></li>
                <li><Link className="block px-3 py-1.5 hover:bg-muted" href="/use-cases/beauty-salons">Beauty salons</Link></li>
                <li><Link className="block px-3 py-1.5 hover:bg-muted" href="/use-cases/restaurants">Restaurants</Link></li>
                <li><Link className="block px-3 py-1.5 hover:bg-muted" href="/use-cases/massages">Massages</Link></li>
                <li><Link className="block px-3 py-1.5 hover:bg-muted" href="/use-cases/clinics-and-medical">Clinics and medical</Link></li>
                <li><Link className="block px-3 py-1.5 hover:bg-muted" href="/use-cases/warehouse-and-transport">Warehouse & transport</Link></li>
                <li><Link className="block px-3 py-1.5 hover:bg-muted" href="/use-cases/hotels-and-accommodations">Hotels & accommodations</Link></li>
                <li><Link className="block px-3 py-1.5 hover:bg-muted" href="/use-cases/public-services">Public services</Link></li>
              </ul>
            </div>
          </div>
          <Link href="/pricing" className="rounded px-2 py-1 hover:bg-neutral-100 hover:text-black dark:hover:bg-neutral-800 dark:hover:text-white">Pricing</Link>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!user ? (
            <Link href="/login" className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90">Sign up</Link>
          ) : (
            <Link href="/dashboard" className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90">Dashboard</Link>
          )}
        </div>
      </div>
    </header>
  );
}


