import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load business and current role
  // Resolve business by owner or membership linkage
  let bizId: string | null = null;
  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (owned?.id) bizId = owned.id as string;
  if (!bizId) {
    const { data: memberOf } = await supabase
      .from("memberships")
      .select("business_id")
      .eq("user_id", user.id)
      .maybeSingle();
    bizId = (memberOf?.business_id as string | undefined) || null;
  }
  if (!bizId) {
    return (
      <main className="py-5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl shadow-sm p-10 text-center">
            <h3 className="text-base font-semibold">No business found</h3>
          </div>
        </div>
      </main>
    );
  }

  // Determine if requester is owner or admin member
  const { data: bizRow } = await supabase
    .from("businesses")
    .select("owner_user_id")
    .eq("id", bizId)
    .maybeSingle();
  const isOwner = (bizRow?.owner_user_id as string | undefined) === user.id;

  const { data: me } = await supabase
    .from("memberships")
    .select("role")
    .eq("business_id", bizId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = isOwner || (me?.role === 'admin');
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Members are rendered by client component

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          </div>
        </div>

        <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6 space-y-6">
          <Suspense>
            <ClientWrapper />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

async function ClientWrapper() {
  const { default: UsersClient } = await import("./users_client");
  return <UsersClient />;
}

// Members rendering is handled by the client wrapper



