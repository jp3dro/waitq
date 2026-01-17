import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Image from "next/image";
import { Button } from "@/components/ui/button";

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
            <Image src="/waitq.svg" alt="WaitQ" className="h-8 w-auto logo-light" width={108} height={32} />
            <Image src="/waitq-variant.svg" alt="WaitQ" className="h-8 w-auto logo-dark" width={108} height={32} />
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-foreground/80">
          <Button asChild variant="ghost" size="sm">
            <Link href="/use-cases/restaurants">Restaurants</Link>
          </Button>

          <Button asChild variant="ghost" size="sm">
            <Link href="/pricing">Pricing</Link>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!user ? (
            <Button asChild size="sm">
              <Link href="/signup">Sign up</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}


