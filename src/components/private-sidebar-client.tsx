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
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    Sparkles,
    Sun,
    Moon,
    Monitor
} from "lucide-react";

import { useTheme } from "next-themes";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle"; // Keeping if needed elsewhere or just remove if fully replaced.
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
    const { setTheme } = useTheme();
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

            <SidebarFooter className="p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg">
                                            {userEmail?.substring(0, 2).toUpperCase() || "CN"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                                        <span className="truncate font-semibold">{userEmail?.split("@")[0] || "User"}</span>
                                        <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarFallback className="rounded-lg">
                                                {userEmail?.substring(0, 2).toUpperCase() || "CN"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{userEmail?.split("@")[0] || "User"}</span>
                                            <span className="truncate text-xs">{userEmail}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex items-center justify-center">
                                                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                                </div>
                                                <span>Theme</span>
                                            </div>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                                                <Sun className="mr-2 h-4 w-4" />
                                                Light
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                                                <Moon className="mr-2 h-4 w-4" />
                                                Dark
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                                                <Monitor className="mr-2 h-4 w-4" />
                                                System
                                            </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <form action="/auth/logout" method="post" id="logout-form">
                                    <DropdownMenuItem asChild className="cursor-pointer">
                                        <button type="submit" className="w-full flex items-center">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Log out
                                        </button>
                                    </DropdownMenuItem>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}


