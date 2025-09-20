import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg tracking-tight">WaitQ</Link>
          <nav className="flex items-center gap-6 text-sm text-neutral-700">
            <Link href="/pricing" className="hover:text-black">Pricing</Link>
            <Link href="/login" className="inline-flex items-center rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-neutral-800">Sign in</Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">
        {children}
      </div>
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10 text-sm text-neutral-600 flex items-center justify-between">
          <p>© {new Date().getFullYear()} WaitQ</p>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-black">Pricing</Link>
            <Link href="/login" className="hover:text-black">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


