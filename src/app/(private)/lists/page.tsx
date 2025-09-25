import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Lists" };

export default async function ListsIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: locations } = await supabase.from("business_locations").select("id, name").order("created_at", { ascending: true });
  const { data: lists } = await supabase.from("waitlists").select("id, name, location_id").order("created_at", { ascending: true });
  const locs = (locations || []) as { id: string; name: string }[];
  const allLists = (lists || []) as { id: string; name: string; location_id: string | null }[];

  return (
    <main className="py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lists</h1>
            <p className="mt-1 text-sm text-neutral-600">All your lists grouped by location</p>
          </div>
        </div>

        <div className="space-y-6">
          {locs.length === 0 ? (
            <div className="bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-10 text-center">
              <h3 className="text-base font-semibold">No locations yet</h3>
              <p className="mt-1 text-sm text-neutral-600">Create a location to start adding lists.</p>
            </div>
          ) : (
            locs.map((loc) => {
              const listsForLoc = allLists.filter((l) => l.location_id === loc.id);
              if (listsForLoc.length === 0) return null;
              return (
                <section key={loc.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">{loc.name}</h2>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listsForLoc.map((l) => (
                      <li key={l.id}>
                        <Link href={`/lists/${l.id}`} className="block bg-white ring-1 ring-black/5 rounded-xl shadow-sm p-5 hover:shadow hover:bg-neutral-50 transition cursor-pointer">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{l.name}</p>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}


