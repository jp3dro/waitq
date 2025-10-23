import ActiveLink from "@/components/active-link";
import { createClient } from "@/lib/supabase/server";
import { LayoutDashboard, ListChecks, Users2, LogOut, MapPin, CreditCard, Building2, Palette, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Image from "next/image";

export default async function PrivateSidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Resolve role via memberships (fallback to email admin for legacy)
  const { data: biz } = await supabase
    .from("businesses")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const { data: me } = biz?.id
    ? await supabase.from("memberships").select("role").eq("business_id", biz.id).eq("user_id", user?.id || "").maybeSingle()
    : { data: null as any };
  const role = (me?.role as string | undefined) || (user?.email === "jp3dro@gmail.com" ? "admin" : undefined);

  return (
    <aside className="h-dvh sticky top-0 w-[200px] shrink-0 border-r border-border bg-card text-card-foreground">
      <div className="h-full flex flex-col">
        <div className="px-4 py-4 border-b border-border bg-card">
          <a href="/dashboard" className="flex items-center" aria-label="WaitQ dashboard">
            <Image src="/waitq.svg" alt="WaitQ" className="h-8 w-auto logo-light" width={108} height={32} />
            <Image src="/waitq-variant.svg" alt="WaitQ" className="h-8 w-auto logo-dark" width={108} height={32} />
          </a>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3 text-sm">
          <div className="space-y-6">
            <div className="space-y-1">
              <ActiveLink href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted hover:text-foreground text-foreground/80" activeClassName="bg-accent/10 text-foreground font-semibold">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </ActiveLink>
              <ActiveLink href="/lists" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted hover:text-foreground text-foreground/80" activeClassName="bg-accent/10 text-foreground font-semibold">
                <ListChecks className="h-4 w-4" />
                <span>Lists</span>
              </ActiveLink>
              {(role === 'admin' || role === 'manager') ? (
              <ActiveLink href="/analytics" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted hover:text-foreground text-foreground/80" activeClassName="bg-accent/10 text-foreground font-semibold">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </ActiveLink>
              ) : null}
              <ActiveLink href="/customers" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted hover:text-foreground text-foreground/80" activeClassName="bg-accent/10 text-foreground font-semibold">
                <Users2 className="h-4 w-4" />
                <span>Customers</span>
              </ActiveLink>
            </div>

            <div>
              <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Settings</div>
              <div className="mt-2 space-y-1">
                {role === 'admin' ? (
                <ActiveLink href="/locations" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted hover:text-foreground text-foreground/80" activeClassName="bg-accent/10 text-foreground font-semibold">
                  <MapPin className="h-4 w-4" />
                  <span>Locations</span>
                </ActiveLink>
                ) : null}
                {role === 'admin' ? (
                <ActiveLink href="/business" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted hover:text-foreground text-foreground/80" activeClassName="bg-accent/10 text-foreground font-semibold">
                  <Building2 className="h-4 w-4" />
                  <span>Business</span>
                </ActiveLink>
                ) : null}
                {role === 'admin' ? (
                <ActiveLink href="/customization" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted hover:text-foreground text-foreground/80" activeClassName="bg-accent/10 text-foreground font-semibold">
                  <Palette className="h-4 w-4" />
                  <span>Customization</span>
                </ActiveLink>
                ) : null}
                {role === 'admin' ? (
                <ActiveLink href="/subscriptions" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted hover:text-foreground text-foreground/80" activeClassName="bg-accent/10 text-foreground font-semibold">
                  <CreditCard className="h-4 w-4" />
                  <span>Subscription</span>
                </ActiveLink>
                ) : null}
                {role === 'admin' ? (
                <ActiveLink href="/users" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted hover:text-foreground text-foreground/80" activeClassName="bg-accent/10 text-foreground font-semibold">
                  <Users2 className="h-4 w-4" />
                  <span>Users</span>
                </ActiveLink>
                ) : null}
              </div>
            </div>
          </div>
        </nav>
        <div className="border-t border-border p-3 text-sm">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="truncate font-medium" title={user.email || undefined}>{user.email}</div>
                <ThemeToggle />
              </div>
              <form action="/auth/logout" method="post">
                <button className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 ring-inset ring-border hover:bg-muted w-full">
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end">
                <ThemeToggle />
              </div>
              <a href="/login" className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 w-full text-center">Sign in</a>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}


