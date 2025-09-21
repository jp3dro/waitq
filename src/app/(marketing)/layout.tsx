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
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10 text-sm text-neutral-600 flex items-center justify-between">
          <p>© {new Date().getFullYear()} WaitQ</p>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-black">Pricing</Link>
            <Link href="/terms" className="hover:text-black">Terms</Link>
            <Link href="/contact" className="hover:text-black">Contact</Link>
            <Link href="/login" className="hover:text-black">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


