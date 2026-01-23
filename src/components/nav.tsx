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
import { QrCode, Users, MonitorPlay } from "lucide-react";

export default async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 pt-4">
      <div className="mx-auto max-w-[1136px] backdrop-blur-sm bg-background/90 dark:bg-background/80 rounded-2xl border border-border shadow-lg shadow-black/5">
        <div className="px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8 min-w-0">
            <Link href="/" className="flex items-center" aria-label="WaitQ home">
              <Image src="/waitq.svg" alt="WaitQ" className="h-8 w-auto logo-light" width={108} height={32} />
              <Image src="/waitq-variant.svg" alt="WaitQ" className="h-8 w-auto logo-dark" width={108} height={32} />
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-7 px-3 bg-transparent">Features</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px]">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/features/self-check-in"
                            className="group block select-none space-y-1 rounded-lg p-4 no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground border border-transparent hover:border-border"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <QrCode className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold leading-none mb-1.5">Self Check-in</div>
                                <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                  Let guests join the waitlist from a kiosk or their phones
                                </p>
                              </div>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/features/virtual-waitlist"
                            className="group block select-none space-y-1 rounded-lg p-4 no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground border border-transparent hover:border-border"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Users className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold leading-none mb-1.5">Virtual Waitlist</div>
                                <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                  Real-time queue management with SMS notifications
                                </p>
                              </div>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/features/virtual-waiting-room"
                            className="group block select-none space-y-1 rounded-lg p-4 no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground border border-transparent hover:border-border"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <MonitorPlay className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold leading-none mb-1.5">Virtual Waiting Room</div>
                                <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                  Public displays and status pages for guests
                                </p>
                              </div>
                            </div>
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
              <Link href="/contact">Contact</Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm">
                <Link href="/lists">Open WaitQ</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Try for free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


