import ActiveLink from "@/components/active-link";
import { createClient } from "@/lib/supabase/server";
import { LayoutDashboard, ListChecks, Users2, Settings, LogOut, MapPin, CreditCard, Building2 } from "lucide-react";
import Image from "next/image";

export default async function PrivateSidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user?.email === "jp3dro@gmail.com";

  return (
    <aside className="h-dvh sticky top-0 w-40 shrink-0 border-r border-default bg-white">
      <div className="h-full flex flex-col">
        <div className="px-4 py-4 border-b border-default bg-gradient-to-b from-neutral-50 to-white">
          <a href="/dashboard" className="flex items-center" aria-label="WaitQ dashboard">
            <Image src="/waitq.svg" alt="WaitQ" className="h-8 w-auto" width={108} height={32} />
          </a>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3 text-sm">
          <div className="space-y-6">
            <div className="space-y-1">
              <ActiveLink href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-neutral-50 hover:text-neutral-900 text-neutral-700" activeClassName="bg-[#fff7ed] text-[#ea580c]">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </ActiveLink>
              <ActiveLink href="/lists" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-neutral-50 hover:text-neutral-900 text-neutral-700" activeClassName="bg-[#fff7ed] text-[#ea580c]">
                <ListChecks className="h-4 w-4" />
                <span>Lists</span>
              </ActiveLink>
              <ActiveLink href="/customers" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-neutral-50 hover:text-neutral-900 text-neutral-700" activeClassName="bg-[#fff7ed] text-[#ea580c]">
                <Users2 className="h-4 w-4" />
                <span>Customers</span>
              </ActiveLink>
            </div>

            <div>
              <div className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Settings</div>
              <div className="mt-2 space-y-1">
                <ActiveLink href="/locations" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-neutral-50 hover:text-neutral-900 text-neutral-700" activeClassName="bg-[#fff7ed] text-[#ea580c]">
                  <MapPin className="h-4 w-4" />
                  <span>Locations</span>
                </ActiveLink>
                <ActiveLink href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-neutral-50 hover:text-neutral-900 text-neutral-700" activeClassName="bg-[#fff7ed] text-[#ea580c]">
                  <Settings className="h-4 w-4" />
                  <span>Profile</span>
                </ActiveLink>
                <ActiveLink href="/subscriptions" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-neutral-50 hover:text-neutral-900 text-neutral-700" activeClassName="bg-[#fff7ed] text-[#ea580c]">
                  <CreditCard className="h-4 w-4" />
                  <span>Subscription</span>
                </ActiveLink>
              </div>
            </div>

            {isAdmin ? (
              <div>
                <div className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Admin</div>
                <div className="mt-2 space-y-1">
                  <ActiveLink href="/businesses" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-neutral-50 hover:text-neutral-900 text-neutral-700" activeClassName="bg-[#fff7ed] text-[#ea580c]">
                    <Building2 className="h-4 w-4" />
                    <span>Businesses</span>
                  </ActiveLink>
                </div>
              </div>
            ) : null}
          </div>
        </nav>
        <div className="border-t border-default p-3 text-sm">
          {user ? (
            <div className="space-y-3">
              <div className="truncate font-medium" title={user.email || undefined}>{user.email}</div>
              <form action="/auth/logout" method="post">
                <button className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 w-full">
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <a href="/login" className="inline-flex items-center justify-center rounded-md bg-black px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 w-full text-center">Sign in</a>
          )}
        </div>
      </div>
    </aside>
  );
}


