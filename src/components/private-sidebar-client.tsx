"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
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
    Check,
    User,
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
    userAvatarUrl: string | null;
    role: string;
};

function NavItem({
    href,
    icon: Icon,
    label,
    subItems,
    rightSlot,
}: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    subItems?: { href: string; label: string }[];
    rightSlot?: React.ReactNode;
}) {
    const pathname = usePathname();
    const isSubActive = subItems?.some((s) => pathname === s.href) ?? false;
    const isActive = pathname === href || (pathname?.startsWith(href + "/") && !subItems);
    // When we have subitems, only mark parent as active if we're exactly on the parent page
    // or if we're on a subpath that doesn't match any subitem

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
                <Link href={href}>
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 truncate">{label}</span>
                    {rightSlot ? <span className="shrink-0">{rightSlot}</span> : null}
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

export default function PrivateSidebarClient({ userName, userEmail, businessLogoUrl, userAvatarUrl, role }: Props) {
    const { theme, setTheme } = useTheme();
    const isAdmin = role === "admin";
    const canSeeInternalAdminLinks = userEmail?.toLowerCase() === "jp3dro@gmail.com";


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
                <Link href="/lists" className="flex items-center px-2" aria-label="WaitQ lists">
                    <Image src="/waitq.svg" alt="WaitQ" className="h-8 w-auto logo-light" width={108} height={32} />
                    <Image src="/waitq-variant.svg" alt="WaitQ" className="h-8 w-auto logo-dark" width={108} height={32} />
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu>
                    <NavItem href="/lists" icon={ListChecks} label="Lists" />
                    <NavItem href="/customers" icon={Users2} label="Customers" />
                    <NavItem href="/analytics" icon={BarChart3} label="Analytics" />
                </SidebarMenu>

                {isAdmin ? (
                    <>
                        <div className="px-2 pt-6">
                            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Admin
                            </div>
                        </div>

                        <SidebarMenu className="pb-4">
                            <NavItem href="/locations" icon={MapPin} label="Locations" />
                            <NavItem href="/business" icon={Building2} label="Business" />
                            <NavItem
                                href="/subscriptions"
                                icon={CreditCard}
                                label="Subscription"
                            />
                            <NavItem href="/users" icon={Users2} label="Staff users" />
                        </SidebarMenu>
                    </>
                ) : null}

                {canSeeInternalAdminLinks ? (
                    <>
                        <div className="px-2 pt-2">
                            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Developers
                            </div>
                        </div>
                        <SidebarMenu className="pb-4">
                            <ExternalNavItem
                                href="https://supabase.com/dashboard/project/ovvdnmgeblznjorxkkcj"
                                icon={Database}
                                label="Supabase"
                            />
                            <ExternalNavItem
                                href="https://sandbox.polar.sh/dashboard"
                                icon={CreditCard}
                                label="Polar"
                            />
                            <ExternalNavItem
                                href="https://gatewayapi.com/app/"
                                icon={MessageSquare}
                                label="GatewayAPI"
                            />
                        </SidebarMenu>
                    </>
                ) : null}
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
                                    <div className="h-8 w-8 rounded-full overflow-hidden border border-border bg-background shrink-0 flex items-center justify-center">
                                        {userAvatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={userAvatarUrl} alt="Profile picture" className="h-full w-full object-cover" />
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
                                                {theme === "light" && <Check className="ml-auto h-4 w-4" />}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                                                <Moon className="mr-2 h-4 w-4" />
                                                Dark
                                                {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                                                <Monitor className="mr-2 h-4 w-4" />
                                                System
                                                {theme === "system" && <Check className="ml-auto h-4 w-4" />}
                                            </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link href="/profile" className="w-full flex items-center">
                                        <User className="mr-2 h-4 w-4" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="cursor-pointer">
                                    {/* Use a plain <a> instead of <Link> to avoid Next.js
                                        prefetch / soft-navigation. The logout route handler
                                        (GET /auth/logout) calls signOut(), so any prefetch or
                                        premature navigation would destroy the session. */}
                                    <a href="/auth/logout" className="w-full flex items-center">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log out
                                    </a>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}


