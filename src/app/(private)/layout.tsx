import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrivateSidebar from "@/components/private-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getAdminClient } from "@/lib/supabase/admin";
import PrivateMobileHeader from "@/components/private-mobile-header";
import { TimeFormatProvider } from "@/components/time-format-provider";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Best-effort: auto-accept pending invites for this user (by email match).
  // This prevents invited users from landing in the app without a resolved business.
  try {
    const admin = getAdminClient();
    const userEmail = (user.email || "").trim().toLowerCase();
    if (userEmail) {
      // Check if user owns a business - if so, don't auto-accept invites
      const { data: ownedBiz } = await admin
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      
      if (!ownedBiz) {
        // Check if user already has an active membership
        const { data: existingMembership } = await admin
          .from("memberships")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();
        
        if (!existingMembership) {
          // User doesn't own a business and has no active membership
          // Look for pending invite by email OR user_id
          const { data: pendingInvite, error: inviteErr } = await admin
            .from("memberships")
            .select("id, invitation_email, invitation_name, business_id, status, user_id")
            .eq("status", "pending")
            .or(`user_id.eq.${user.id},invitation_email.ilike.${userEmail}`)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (inviteErr) {
            console.error("[auto-accept] Error finding pending invite:", inviteErr);
          }

          if (pendingInvite?.id) {
            console.log("[auto-accept] Found pending invite:", pendingInvite.id);
            
            // Persist inviter-provided name (if any)
            const invitationName = (pendingInvite as any)?.invitation_name;
            if (typeof invitationName === "string" && invitationName.trim().length >= 2) {
              try {
                await admin.auth.admin.updateUserById(user.id, {
                  user_metadata: {
                    full_name: invitationName.trim(),
                    name: invitationName.trim(),
                  },
                });
              } catch (nameErr) {
                console.error("[auto-accept] Error updating user name:", nameErr);
              }
            }

            const { error: updateErr } = await admin
              .from("memberships")
              .update({
                status: "active",
                user_id: user.id,
                invitation_email: null,
                token: null,
              })
              .eq("id", pendingInvite.id);
            
            if (updateErr) {
              console.error("[auto-accept] Error updating membership:", updateErr);
            } else {
              console.log("[auto-accept] Successfully activated membership:", pendingInvite.id);
            }
            
            // Mark onboarding as completed for invited users
            const { error: profileErr } = await admin
              .from("profiles")
              .upsert({ id: user.id, onboarding_completed: true, onboarding_step: 5 }, { onConflict: "id" });
            
            if (profileErr) {
              console.error("[auto-accept] Error updating profile:", profileErr);
            }
          } else {
            console.log("[auto-accept] No pending invite found for user:", user.id, "email:", userEmail);
          }
        } else {
          console.log("[auto-accept] User already has active membership:", existingMembership.id);
        }
      } else {
        console.log("[auto-accept] User owns a business, skipping auto-accept");
      }
    }
  } catch (err) {
    console.error("[auto-accept] Unexpected error:", err);
  }

  const { data: profile } = await supabase.from('profiles').select('onboarding_completed').eq('id', user.id).single();
  if (!profile || !profile.onboarding_completed) {
    const { data: owned } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (!owned?.id) {
      const { data: membership } = await supabase
        .from("memberships")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (!membership?.id) {
        redirect("/onboarding");
      }
    }
  }

  // Final check: does user have access to any business?
  // Use admin client to bypass RLS policies for this access check
  const admin = getAdminClient();
  const { data: ownedBiz } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!ownedBiz?.id) {
    const { data: activeMembership } = await admin
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    
    if (!activeMembership?.id) {
      // User has no business and no active membership
      redirect("/no-access");
    }
  }

  return (
    <SidebarProvider defaultOpen>
      <PrivateSidebar />
      <SidebarInset className="min-h-dvh bg-background">
        <PrivateMobileHeader />
        <TimeFormatProvider>{children}</TimeFormatProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}


