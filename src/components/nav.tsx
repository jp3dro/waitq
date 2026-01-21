import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 pt-4">
      <div className="mx-auto max-w-[1200px] backdrop-blur-xl bg-background/90 dark:bg-background/80 rounded-2xl border border-border shadow-lg shadow-black/5">
        <div className="px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8 min-w-0">
            <Link href="/" className="flex items-center" aria-label="WaitQ home">
              <Image src="/waitq.svg" alt="WaitQ" className="h-8 w-auto logo-light" width={108} height={32} />
              <Image src="/waitq-variant.svg" alt="WaitQ" className="h-8 w-auto logo-dark" width={108} height={32} />
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-foreground/80">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-7 px-3">Platform</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-2">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/platform/virtual-waitlist"
                            className="block select-none space-y-1 rounded-md p-3 no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium">Virtual Waitlist</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Keep customers in the loop with real-time waitlist updates
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/use-cases/restaurants"
                            className="block select-none space-y-1 rounded-md p-3 no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium">For Restaurants</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Restaurant-specific queue management solutions
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Button asChild variant="ghost" size="sm">
              <Link href="/pricing">Pricing</Link>
            </Button>
            
            <Button asChild variant="ghost" size="sm">
              <Link href="/contact">Resources</Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Try for free</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}


