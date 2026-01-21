import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import InviteClient from "./invite-client";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = getAdminClient();

  // Validate token
  const { data: membership } = await admin
    .from("memberships")
    .select("id, business_id, invitation_email, status, role, created_at")
    .eq("token", token)
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

  // Check expiry (48h)
  const created = new Date(membership.created_at).getTime();
  const now = Date.now();
  if ((now - created) > 48 * 60 * 60 * 1000) {
      return (
        <main className="min-h-dvh flex items-center justify-center p-6">
            <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Invite Expired</h1>
            <p className="mt-2 text-muted-foreground">This invitation has expired. Please contact the person who invited you to resend the invitation.</p>
            </div>
        </main>
      );
  }

  if (membership.status === 'active') {
     redirect("/lists");
  }

  const { data: business } = await admin
    .from("businesses")
    .select("name")
    .eq("id", membership.business_id)
    .single();

  const businessName = business?.name || "Unknown Business";

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-background text-foreground">
        <InviteClient 
            businessName={businessName} 
            email={membership.invitation_email || ""} 
            token={token}
        />
    </main>
  );
}

