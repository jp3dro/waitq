import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Businesses" };

export default async function AdminBusinessesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Platform-admin view only; everyone else should go to their own business page.
  if (!user || user.email !== "jp3dro@gmail.com") redirect("/business");

  // For now, list all businesses with name, owner email and placeholder subscription status
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, owner_user_id, created_at")
    .order("created_at", { ascending: false });

  const owners: Record<string, string> = {};
  if (businesses && businesses.length) {
    const ownerIds = Array.from(new Set(businesses.map((b) => b.owner_user_id as string)));
    // Fetch emails for owners in batches (limited by RLS; as admin view this can be basic for now)
    // In absence of a users table, we show the ID only
    ownerIds.forEach((id) => (owners[id] = id));
  }

  const rows = (businesses || []).map((b) => ({
    id: b.id as string,
    name: (b.name as string) || "",
    owner: owners[b.owner_user_id as string] || (b.owner_user_id as string),
    createdAt: b.created_at as string,
    subscription: "unknown",
  }));

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
            <p className="mt-1 text-sm text-neutral-600">Admin view of all businesses</p>
          </div>
        </div>

        <div className="bg-white ring-1 ring-black/5 rounded-xl p-6">
          <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 sticky top-0 z-10">
            <tr className="text-left text-neutral-700">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Owner</th>
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2">Subscription</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-neutral-50 odd:bg-neutral-50/30">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.owner}</td>
                <td className="px-4 py-2">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2">{r.subscription}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-neutral-600">No businesses found</td>
              </tr>
            ) : null}
          </tbody>
        </table>
          </div>
        </div>
      </div>
    </main>
  );
}


