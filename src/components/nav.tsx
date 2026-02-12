import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import MarketingMobileMenu from "@/components/marketing-mobile-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { QrCode, Users, MonitorPlay, BarChart3, type LucideIcon } from "lucide-react";
import { ContactModal } from "@/components/contact-modal";
import { getGlobalSettings } from "@/lib/tina";

// Icon mapping for dynamic icon rendering from TinaCMS
const iconMap: Record<string, LucideIcon> = {
  QrCode,
  Users,
  MonitorPlay,
  BarChart3,
};

export type FeatureItem = {
  title: string;
  description: string;
  href: string;
  icon: string;
};

export default async function Nav() {
  const supabase = await createClient();
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    // Supabase unreachable or returned non-JSON — treat as unauthenticated.
  }
  
  // Fetch feature items from TinaCMS
  let featureItems: FeatureItem[] = [];
  try {
    const globalSettings = await getGlobalSettings();
    featureItems = (globalSettings.data.global.header?.featuresDropdown?.items || []) as FeatureItem[];
  } catch {
    // Fallback to empty array if TinaCMS fails
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 pt-4">
      <div className="mx-auto max-w-[1136px] backdrop-blur-sm bg-background/90 dark:bg-background/80 rounded-2xl border border-border shadow-lg shadow-black/5">
        <div className="px-6 h-16 flex items-center justify-between">
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
                      {featureItems.map((item) => {
                        const IconComponent = iconMap[item.icon] || QrCode;
                        return (
                          <li key={item.href}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={item.href}
                                className="group block select-none space-y-1 rounded-lg p-4 no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground border border-transparent hover:border-border"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <IconComponent className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold leading-none mb-1.5">{item.title}</div>
                                    <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        );
                      })}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Button asChild variant="ghost" size="sm">
              <Link href="/pricing">Pricing</Link>
            </Button>
            
            <ContactModal>
              <Button variant="ghost" size="sm">Contact</Button>
            </ContactModal>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Button asChild size="sm">
                  <Link href="/lists">Open WaitQ</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/signup">Try for free</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="md:hidden">
              <MarketingMobileMenu isAuthed={!!user} featureItems={featureItems} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


