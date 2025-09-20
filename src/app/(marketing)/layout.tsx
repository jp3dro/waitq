import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <header className="p-4 flex items-center justify-between border-b">
        <Link href="/" className="font-semibold">WaitQ</Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/pricing" className="hover:underline">Pricing</Link>
          <Link href="/login" className="hover:underline">Sign in</Link>
        </nav>
      </header>
      {children}
      <footer className="p-6 border-t text-center text-sm text-neutral-500">© {new Date().getFullYear()} WaitQ</footer>
    </div>
  );
}


