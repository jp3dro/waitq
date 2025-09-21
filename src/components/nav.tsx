import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8 min-w-0">
          <Link href="/" className="font-semibold text-lg tracking-tight text-neutral-900">WaitQ</Link>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-neutral-700">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-black">Dashboard</Link>
              <Link href="/settings" className="hover:text-black">Settings</Link>
            </>
          ) : null}
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


