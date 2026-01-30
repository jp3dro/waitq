import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomersTable from "./table";
import { resolveCurrentBusinessId } from "@/lib/current-business";

export const metadata = { title: "Customer Visits" };

export default async function CustomersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const businessId = await resolveCurrentBusinessId(supabase as any, user.id);
  if (!businessId) {
    return (
      <main className="py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl shadow-sm p-10 text-center">
            <h3 className="text-base font-semibold">No business found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Create a business to view customer visits.</p>
          </div>
        </div>
      </main>
    );
  }

  // Fetch locations and waitlists for filter options
  const { data: locations } = await supabase
    .from("business_locations")
    .select("id, name")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  const { data: waitlists } = await supabase
    .from("waitlists")
    .select("id, name, location_id, list_type, seating_preferences, ask_name, ask_phone, ask_email")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customer Visits</h1>
        </div>

        <CustomersTable 
          businessId={businessId}
          locations={locations || []} 
          waitlists={waitlists || []} 
        />
      </div>
    </main>
  );
}


