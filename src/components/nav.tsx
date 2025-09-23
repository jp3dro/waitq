import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let business: { name: string | null; logo_url: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("businesses")
      .select("name, logo_url")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) business = { name: (data as any).name ?? null, logo_url: (data as any).logo_url ?? null };
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {user && business?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logo_url} alt="Logo" className="h-6 w-6 rounded object-cover ring-1 ring-neutral-200" />
          ) : null}
          <Link href={user ? "/dashboard" : "/"} className="font-semibold text-lg tracking-tight text-neutral-900">{user && business?.name ? business.name : "WaitQ"}</Link>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-neutral-700">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-black">Dashboard</Link>
              <Link href="/settings" className="hover:text-black">Settings</Link>
            </>
          ) : (
            <>
              <div className="relative group">
                <button className="inline-flex items-center gap-1 hover:text-black">Use cases
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
                </button>
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto absolute left-0 mt-2 w-[280px] rounded-md border bg-white shadow-md">
                  <ul className="py-2 text-sm">
                    <li><Link className="block px-3 py-1.5 hover:bg-neutral-50" href="/use-cases/barber-shop">Barber shops</Link></li>
                    <li><Link className="block px-3 py-1.5 hover:bg-neutral-50" href="/use-cases/beauty-salons">Beauty salons</Link></li>
                    <li><Link className="block px-3 py-1.5 hover:bg-neutral-50" href="/use-cases/restaurants">Restaurants</Link></li>
                    <li><Link className="block px-3 py-1.5 hover:bg-neutral-50" href="/use-cases/massages">Massages</Link></li>
                    <li><Link className="block px-3 py-1.5 hover:bg-neutral-50" href="/use-cases/clinics-and-medical">Clinics and medical</Link></li>
                    <li><Link className="block px-3 py-1.5 hover:bg-neutral-50" href="/use-cases/warehouse-and-transport">Warehouse & transport</Link></li>
                    <li><Link className="block px-3 py-1.5 hover:bg-neutral-50" href="/use-cases/hotels-and-accommodations">Hotels & accommodations</Link></li>
                    <li><Link className="block px-3 py-1.5 hover:bg-neutral-50" href="/use-cases/public-services">Public services</Link></li>
                  </ul>
                </div>
              </div>
              <Link href="/pricing" className="hover:text-black">Pricing</Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!user ? (
            <Link href="/login" className="inline-flex items-center rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-neutral-800">Sign up</Link>
          ) : (
            <form action="/auth/logout" method="post">
              <button className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50">Log out</button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}


