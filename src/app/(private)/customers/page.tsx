import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomersTable from "./table";

export const metadata = { title: "Customers" };

type Entry = {
  id: string;
  customer_name: string | null;
  phone: string | null;
  created_at: string;
  notified_at: string | null;
};

export default async function CustomersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: biz } = await supabase
    .from("businesses")
    .select("id, name, logo_url")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const business = (biz || null) as { id: string; name: string | null; logo_url: string | null } | null;
  if (!business) {
    return (
      <main className="py-5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-10 text-center">
            <h3 className="text-base font-semibold">No business found</h3>
            <p className="mt-1 text-sm text-neutral-600">Create a business to view customers.</p>
          </div>
        </div>
      </main>
    );
  }

  const { data: rows } = await supabase
    .from("waitlist_entries")
    .select("id, customer_name, phone, created_at, notified_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(5000);

  const entries = (rows || []) as Entry[];

  type Customer = {
    key: string;
    name: string | null;
    phone: string | null;
    visits: number;
    firstSeen: string;
    lastSeen: string;
    servedCount: number;
  };

  const normalize = (v: string | null) => (v ? v.replace(/\D+/g, "") : "");

  const map = new Map<string, Customer>();
  for (const r of entries) {
    const phoneKey = normalize(r.phone);
    const key = phoneKey || (r.customer_name ? `name:${r.customer_name.toLowerCase()}` : `id:${r.id}`);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        name: r.customer_name || null,
        phone: r.phone || null,
        visits: 1,
        firstSeen: r.created_at,
        lastSeen: r.created_at,
        servedCount: r.notified_at ? 1 : 0,
      });
    } else {
      existing.visits += 1;
      if (r.notified_at) existing.servedCount += 1;
      if (new Date(r.created_at) < new Date(existing.firstSeen)) existing.firstSeen = r.created_at;
      if (new Date(r.created_at) > new Date(existing.lastSeen)) {
        existing.lastSeen = r.created_at;
        if (r.customer_name) existing.name = r.customer_name;
        if (r.phone) existing.phone = r.phone;
      }
    }
  }

  const customers = Array.from(map.values()).sort(
    (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
  );

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-neutral-600">Customers deduplicated from all waitlists</p>
        </div>

        <CustomersTable initialCustomers={customers} />
      </div>
    </main>
  );
}


