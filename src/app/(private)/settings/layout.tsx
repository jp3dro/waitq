import Link from "next/link";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        <div className="mt-6 grid md:grid-cols-[220px_1fr] gap-8">
          <aside className="space-y-1 text-sm">
            <Link href="/settings/profile" className="block px-3 py-2 rounded-md hover:bg-neutral-50">Profile</Link>
            <Link href="/settings/locations" className="block px-3 py-2 rounded-md hover:bg-neutral-50">Locations</Link>
            <Link href="/settings/lists" className="block px-3 py-2 rounded-md hover:bg-neutral-50">Lists</Link>
            <Link href="/settings/subscription" className="block px-3 py-2 rounded-md hover:bg-neutral-50">Subscription</Link>
          </aside>
          <section className="min-h-[300px]">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}


