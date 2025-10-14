import ActiveLink from "@/components/active-link";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user?.email === "jp3dro@gmail.com";
  return (
    <main className="py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        <div className="mt-6 grid md:grid-cols-[220px_1fr] gap-8">
          <aside className="space-y-1 text-sm">
            <ActiveLink href="/settings/profile" className="block px-3 py-2 rounded-md hover:bg-neutral-50" activeClassName="bg-neutral-100 text-black">Profile</ActiveLink>
            <ActiveLink href="/settings/locations" className="block px-3 py-2 rounded-md hover:bg-neutral-50" activeClassName="bg-neutral-100 text-black">Locations</ActiveLink>
            <ActiveLink href="/settings/lists" className="block px-3 py-2 rounded-md hover:bg-neutral-50" activeClassName="bg-neutral-100 text-black">Lists</ActiveLink>
            <ActiveLink href="/settings/subscription" className="block px-3 py-2 rounded-md hover:bg-neutral-50" activeClassName="bg-neutral-100 text-black">Subscription</ActiveLink>
            {isAdmin ? (
              <div className="pt-4">
                <div className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Admin</div>
                <ActiveLink href="/settings/admin/businesses" className="mt-1 block px-3 py-2 rounded-md hover:bg-neutral-50" activeClassName="bg-neutral-100 text-black">Businesses</ActiveLink>
              </div>
            ) : null}
          </aside>
          <section className="min-h-[300px]">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}


