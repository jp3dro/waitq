import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function RejectInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = getAdminClient();

  // Validate token
  const { data: membership } = await admin
    .from("memberships")
    .select("id, business_id")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (!membership) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Invite</h1>
          <p className="mt-2 text-muted-foreground">This invitation link is invalid or has expired.</p>
        </div>
      </main>
    );
  }

  const { data: business } = await admin
    .from("businesses")
    .select("name")
    .eq("id", membership.business_id)
    .single();

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-card text-card-foreground p-8 shadow-sm ring-1 ring-border rounded-xl text-center">
        <h2 className="text-xl font-semibold">Reject Invitation</h2>
        <p className="mt-2 text-muted-foreground">
          Are you sure you want to reject the invitation to join <strong>{business?.name}</strong>?
        </p>
        <form action={async () => {
            "use server";
            const admin = getAdminClient();
            // Delete the membership row
            await admin.from("memberships").delete().eq("token", token);
            redirect("/");
        }} className="mt-6 flex gap-3 justify-center">
            <a href={`/invite/${token}`} className="action-btn">Cancel</a>
            <button type="submit" className="action-btn bg-red-600 text-white hover:bg-red-700 border-transparent">Reject Invite</button>
        </form>
      </div>
    </main>
  );
}

