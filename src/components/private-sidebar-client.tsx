"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Users2,
  LogOut,
  MapPin,
  CreditCard,
  Building2,
  BarChart3,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type Props = {
  userEmail: string | null;
  role?: string;
  lists: { id: string; name: string }[];
};

function NavItem({
  href,
  icon: Icon,
  label,
  subItems,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  subItems?: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (pathname.startsWith(href + "/") && !subItems);
  const isSubActive = subItems?.some((s) => pathname === s.href) ?? false;
  // If we have subitems, we might want the parent to show active if a child is active, OR just let the child be active.
  // Requirement: "show a little bit indented to show a dependency on Lists"
  // Let's keep the parent active if on the main list page, and separate active state for children.

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <Link href={href}>
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
      {subItems && subItems.length > 0 && (
        <div className="flex flex-col gap-0.5 mt-0.5 ml-4 border-l border-border pl-2">
          {subItems.map((sub) => {
            const isChildActive = pathname === sub.href;
            return (
              <SidebarMenuButton
                key={sub.href}
                asChild
                isActive={isChildActive}
                size="sm"
                className="h-8 text-sm font-normal"
              >
                <Link href={sub.href}>
                  <span>{sub.label}</span>
                </Link>
              </SidebarMenuButton>
            );
          })}
        </div>
      )}
    </SidebarMenuItem>
  );
}

export default function PrivateSidebarClient({ userEmail, role, lists }: Props) {
  const canSeeAnalytics = role === "admin" || role === "manager";
  const isAdmin = role === "admin";

  const listSubItems = lists.map((l) => ({
    href: `/lists/${l.id}`,
    label: l.name,
  }));

  return (
    <Sidebar variant="floating" collapsible="none" className="border-0">
      <SidebarHeader className="py-4">
        <Link href="/dashboard" className="flex items-center px-2" aria-label="WaitQ dashboard">
          <Image src="/waitq.svg" alt="WaitQ" className="h-8 w-auto logo-light" width={108} height={32} />
          <Image src="/waitq-variant.svg" alt="WaitQ" className="h-8 w-auto logo-dark" width={108} height={32} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem href="/lists" icon={ListChecks} label="Lists" subItems={listSubItems} />
          {canSeeAnalytics ? <NavItem href="/analytics" icon={BarChart3} label="Analytics" /> : null}
          <NavItem href="/customers" icon={Users2} label="Customers" />
        </SidebarMenu>

        <div className="mt-auto px-2 pt-4">
          <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Settings
          </div>
        </div>

        <SidebarMenu className="pb-4">
          {isAdmin ? <NavItem href="/business" icon={Building2} label="Business" /> : null}
          {isAdmin ? <NavItem href="/subscriptions" icon={CreditCard} label="Subscription" /> : null}
          {isAdmin ? <NavItem href="/locations" icon={MapPin} label="Locations" /> : null}
          {isAdmin ? <NavItem href="/users" icon={Users2} label="Users" /> : null}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="gap-3">
        {userEmail ? (
          <>
            <div className="flex items-center justify-between gap-2 px-1">
              <div className={cn("truncate text-sm font-medium")} title={userEmail}>
                {userEmail}
              </div>
            </div>
            <div className="flex w-full items-center gap-2">
              <form action="/auth/logout" method="post" className="flex-1">
                <Button type="submit" variant="outline" className="w-full justify-start gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </form>
              <ThemeToggle />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button asChild className="flex-1">
                <Link href="/login">Sign in</Link>
              </Button>
              <ThemeToggle />
            </div>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}


