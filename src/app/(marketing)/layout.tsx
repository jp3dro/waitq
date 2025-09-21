import Nav from "@/components/nav";
import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Shared top navigation */}
      <Nav />
      <div className="flex-1">
        {children}
      </div>
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10 text-sm text-neutral-600 grid gap-6 md:grid-cols-4">
          <div>
            <p className="font-semibold text-neutral-900">WaitQ</p>
            <p className="mt-2">© {new Date().getFullYear()} WaitQ</p>
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Use cases</p>
            <ul className="mt-2 space-y-2">
              <li><Link href="/use-cases/barber-shop" className="hover:text-black">Barber shops</Link></li>
              <li><Link href="/use-cases/beauty-salons" className="hover:text-black">Beauty salons</Link></li>
              <li><Link href="/use-cases/restaurants" className="hover:text-black">Restaurants</Link></li>
              <li><Link href="/use-cases/massages" className="hover:text-black">Massages</Link></li>
              <li><Link href="/use-cases/clinics-and-medical" className="hover:text-black">Clinics & medical</Link></li>
              <li><Link href="/use-cases/warehouse-and-transport" className="hover:text-black">Warehouse & transport</Link></li>
              <li><Link href="/use-cases/hotels-and-accommodations" className="hover:text-black">Hotels & accommodations</Link></li>
              <li><Link href="/use-cases/public-services" className="hover:text-black">Public services</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Company</p>
            <ul className="mt-2 space-y-2">
              <li><Link href="/pricing" className="hover:text-black">Pricing</Link></li>
              <li><Link href="/terms" className="hover:text-black">Terms</Link></li>
              <li><Link href="/contact" className="hover:text-black">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Account</p>
            <ul className="mt-2 space-y-2">
              <li><Link href="/login" className="hover:text-black">Sign in</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}


