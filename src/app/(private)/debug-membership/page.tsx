import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DebugMembershipPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const admin = getAdminClient();
  
  // Check for owned business
  const { data: ownedBiz } = await admin
    .from("businesses")
    .select("id, name, owner_user_id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  // Check for active membership
  const { data: activeMembership } = await admin
    .from("memberships")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  // Check for pending membership by user_id
  const { data: pendingByUserId } = await admin
    .from("memberships")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  // Check for pending membership by email
  const userEmail = (user.email || "").trim().toLowerCase();
  const { data: pendingByEmail, error: pendingByEmailErr } = await admin
    .from("memberships")
    .select("*")
    .eq("status", "pending")
    .ilike("invitation_email", userEmail)
    .maybeSingle();

  // Check for ANY pending memberships (for debugging)
  const { data: allPending } = await admin
    .from("memberships")
    .select("*")
    .eq("status", "pending")
    .limit(10);

  // Check with regular client too for comparison
  const { data: activeMembershipRegular } = await supabase
    .from("memberships")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  return (
    <main className="py-8">
      <div className="mx-auto max-w-4xl px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Membership Debug Info</h1>
          <Button asChild variant="outline">
            <Link href="/lists">Back to Lists</Link>
          </Button>
        </div>
        
        <div className="space-y-8">
          {/* User Info */}
          <section className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {JSON.stringify(
                {
                  id: user.id,
                  email: user.email,
                  email_lowercase: userEmail,
                  user_metadata: user.user_metadata,
                },
                null,
                2
              )}
            </pre>
          </section>

          {/* Owned Business */}
          <section className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Owned Business</h2>
            {ownedBiz ? (
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(ownedBiz, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">No business owned</p>
            )}
          </section>

          {/* Active Membership (Admin Client) */}
          <section className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Active Membership (Admin Client)</h2>
            {activeMembership ? (
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(activeMembership, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">No active membership found</p>
            )}
          </section>

          {/* Active Membership (Regular Client - RLS) */}
          <section className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">
              Active Membership (Regular Client - Subject to RLS)
              {!activeMembershipRegular && activeMembership && (
                <span className="ml-2 text-sm text-destructive font-normal">
                  ⚠️ RLS is blocking access!
                </span>
              )}
            </h2>
            {activeMembershipRegular ? (
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(activeMembershipRegular, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">
                No active membership found via regular client
                {activeMembership && (
                  <span className="block mt-2 text-destructive">
                    But admin client CAN see it - this indicates an RLS policy issue!
                  </span>
                )}
              </p>
            )}
          </section>

          {/* Pending by User ID */}
          <section className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Pending Membership (by user_id)</h2>
            {pendingByUserId ? (
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(pendingByUserId, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">No pending membership found by user_id</p>
            )}
          </section>

          {/* Pending by Email */}
          <section className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">
              Pending Membership (by email: {userEmail})
            </h2>
            {pendingByEmailErr && (
              <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded">
                <strong>Error:</strong> {pendingByEmailErr.message}
              </div>
            )}
            {pendingByEmail ? (
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(pendingByEmail, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">No pending membership found by email</p>
            )}
          </section>

          {/* All Pending */}
          <section className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">All Pending Memberships (limit 10)</h2>
            {allPending && allPending.length > 0 ? (
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(allPending, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">No pending memberships in system</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
