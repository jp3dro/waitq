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
    ChevronsUpDown,
    Sun,
    Moon,
    Monitor,
    ExternalLink,
    Database,
    MessageSquare,
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
    userName: string | null;
    userEmail: string | null;
    businessLogoUrl: string | null;
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
    const isSubActive = subItems?.some((s) => pathname === s.href) ?? false;
    const isActive = pathname === href || (pathname.startsWith(href + "/") && !subItems) || isSubActive;
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

function ExternalNavItem({
    href,
    icon: Icon,
    label,
}: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}) {
    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={label}>
                <a href={href} target="_blank" rel="noopener noreferrer">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                    <ExternalLink className="ml-auto h-4 w-4 opacity-70" />
                </a>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export default function PrivateSidebarClient({ userName, userEmail, businessLogoUrl, role, lists }: Props) {
    const { setTheme } = useTheme();
    const canSeeAnalytics = role === "admin" || role === "manager";
    const isAdmin = role === "admin";
    const canSeeInternalAdminLinks = userEmail?.toLowerCase() === "jp3dro@gmail.com";

    const listSubItems = lists.map((l) => ({
        href: `/lists/${l.id}`,
        label: l.name,
    }));

    const displayName = userName || userEmail?.split("@")[0] || "User";
    const initials = (() => {
        const raw = userName?.trim() || "";
        if (raw) {
            const parts = raw.split(/\s+/);
            if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
            return raw.slice(0, 2).toUpperCase();
        }
        if (userEmail) return userEmail.slice(0, 2).toUpperCase();
        return "??";
    })();

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

                {canSeeInternalAdminLinks ? (
                    <>
                        <div className="mt-auto px-2 pt-2">
                            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Admin
                            </div>
                        </div>
                        <SidebarMenu className="pb-4">
                            <ExternalNavItem
                                href="https://supabase.com/dashboard/project/ovvdnmgeblznjorxkkcj"
                                icon={Database}
                                label="Supabase"
                            />
                            <ExternalNavItem
                                href="https://dashboard.stripe.com/acct_1S9XLrAp5ApQoW6E/dashboard"
                                icon={CreditCard}
                                label="Stripe"
                            />
                            <ExternalNavItem
                                href="https://portal.bulkgate.com/dashboard/"
                                icon={MessageSquare}
                                label="BulkGate"
                            />
                        </SidebarMenu>
                    </>
                ) : null}

                <div className="px-2 pt-2">
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

            <SidebarFooter className="ml-[-8px] mr-[8px]">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <div className="h-8 w-8 rounded-sm overflow-hidden border border-border bg-background shrink-0 flex items-center justify-center">
                                        {businessLogoUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={businessLogoUrl} alt="Business logo" className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-semibold text-muted-foreground">{initials}</span>
                                        )}
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                                        <span className="truncate font-semibold">{displayName}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] rounded-lg"
                                side="bottom"
                                align="start"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="px-2 py-1.5 font-normal">
                                    <div className="grid text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{displayName}</span>
                                        {userEmail && (
                                            <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                                        )}
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


