import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddForm from "./waitlist-add-form";
import WaitlistTable from "./waitlist-table";
import Modal from "@/components/modal";
import AddButton from "./waitlist-add-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Waitlist</h1>
            <p className="mt-1 text-sm text-neutral-600">Signed in as {user.email}</p>
          </div>
          <AddButton />
        </div>

        <WaitlistTable />
      </div>
    </main>
  );
}


