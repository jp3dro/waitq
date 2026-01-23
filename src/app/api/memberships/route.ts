import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { getPlanContext } from "@/lib/plan-limits";
import { buildInviteEmailHtml as buildInviteEmailHtmlTemplate } from "@/lib/email-templates";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://waitq.com";

function escapeHtml(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildInviteEmailHtml({
  recipientName,
  businessName,
  acceptUrl,
}: {
  recipientName?: string | null;
  businessName: string;
  acceptUrl: string;
}) {
  return buildInviteEmailHtmlTemplate({
    recipientName,
    businessName,
    acceptUrl,
    siteUrl: SITE_URL,
  });
}

function validateRole(role: unknown): role is 'staff' | 'admin' {
  return role === 'staff' || role === 'admin';
}

async function resolveBusinessId(userId: string) {
  const supabase = await createRouteClient();
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("active_business_id")?.value || null;
  if (fromCookie) return fromCookie;
  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (owned?.id) return owned.id as string;
  const { data: memberOf } = await supabase
    .from("memberships")
    .select("business_id")
    .eq("user_id", userId)
    .maybeSingle();
  return (memberOf?.business_id as string | undefined) || null;
}

export async function POST(req: NextRequest) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, role, name } = await req.json().catch(() => ({}));
  if (!email || typeof email !== 'string') return NextResponse.json({ error: "Missing email" }, { status: 400 });
  const invRole = validateRole(role) ? role : 'staff';
  let inviteeName = typeof name === "string" ? name.trim() : "";

  const businessId = await resolveBusinessId(user.id);
  if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 400 });

  // Only admins or owners can invite
  const { data: biz } = await supabase.from("businesses").select("owner_user_id").eq("id", businessId).maybeSingle();
  const isOwner = (biz?.owner_user_id as string | undefined) === user.id;
  const { data: me } = await supabase.from("memberships").select("role").eq("business_id", businessId).eq("user_id", user.id).maybeSingle();
  if (!(isOwner || me?.role === 'admin')) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Prevent self-invite
  if (user.email === email) {
    return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Check if email is already associated with a business (active or pending)
  // 1. Check pending invites by email
  const { data: pending } = await admin
    .from("memberships")
    .select("id, created_at, invitation_name")
    .eq("invitation_email", email)
    .maybeSingle();
  
  let membershipId: string | null = null;
  let token: string | null = null;

  if (pending) {
    // Check if expired (older than 48h)
    const createdAt = new Date(pending.created_at).getTime();
    const now = Date.now();
    const diffHours = (now - createdAt) / (1000 * 60 * 60);
    
    if (diffHours < 48) {
       return NextResponse.json({ error: "This email is already invited to a business" }, { status: 400 });
    }
    
    // Expired: Update existing membership with new token and timestamp
    // We regenerate token using SQL update or application side?
    // Let's use application side or just let trigger handle it?
    // Easier to just delete and re-insert or update.
    // Let's update.
    const newToken = crypto.randomUUID().replace(/-/g, ''); // Using simple generation or let DB do it?
    // DB default is only on insert.
    // Let's update created_at to now() and let token stay same? Or rotate? 
    // Ideally rotate for security.
    
    // Actually, the prompt says "Resend" button.
    // If we are here via POST (Invite), it means we are inviting again.
    // So we should refresh the invite.
    
    const updatePayload: Record<string, unknown> = {
      created_at: new Date().toISOString(),
      token: crypto.randomUUID().replace(/-/g, '')
    };
    if (inviteeName) {
      updatePayload.invitation_name = inviteeName;
    }

    const { data: updated, error: upErr } = await admin
        .from("memberships")
        .update(updatePayload)
        .eq("id", pending.id)
        .select("id, token, invitation_name")
        .single();
    
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });
    membershipId = updated.id;
    token = updated.token;
    if (!inviteeName) {
      // Preserve previously stored display name if caller did not provide one
      inviteeName = updated.invitation_name || "";
    }
  } else {
      // Enforce user seat limits for this business (owner + active/pending memberships).
      // We only enforce when creating a NEW invite (not when refreshing an existing invite).
      try {
        const ctx = await getPlanContext(businessId);
        const upgradeTo = ctx.planId === "free" ? "base" : ctx.planId === "base" ? "premium" : null;
        const { data: bizRow } = await admin.from("businesses").select("owner_user_id").eq("id", businessId).maybeSingle();
        const ownerUserId = (bizRow?.owner_user_id as string | undefined) || null;
        let q = admin
          .from("memberships")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .in("status", ["active", "pending"]);
        if (ownerUserId) {
          q = q.or(`user_id.is.null,user_id.neq.${ownerUserId}`);
        }
        const { count } = await q;
        const usedSeats = 1 + (count || 0);
        if (usedSeats >= ctx.limits.users) {
          const planLabel = ctx.planId === "base" ? "Base" : ctx.planId === "free" ? "Free" : "your";
          const upgradeLabel = upgradeTo === "premium" ? "Premium" : "Base";
          return NextResponse.json(
            {
              error: `User limit reached for the ${planLabel} plan. Upgrade to ${upgradeLabel} to invite more staff users.`,
              upgradeTo,
            },
            { status: 403 }
          );
        }
      } catch {
        // If we fail to compute limits, continue and let downstream constraints apply.
      }

      // ... normal insert ...
      const { data: { users } } = await admin.auth.admin.listUsers();
      const targetUser = users.find(u => u.email === email);
      if (targetUser) {
        // Check if they own a business
        const { data: ownedBusiness } = await admin
          .from("businesses")
          .select("id")
          .eq("owner_user_id", targetUser.id)
          .maybeSingle();
        
        if (ownedBusiness) {
          return NextResponse.json({ 
            error: "This user owns a business and cannot be invited to join another organization" 
          }, { status: 400 });
        }

        // Check for any existing membership
        const { data: existingMember } = await admin
          .from("memberships")
          .select("id, business_id")
          .eq("user_id", targetUser.id)
          .eq("status", "active")
          .maybeSingle();
        
        if (existingMember) {
          // Check if it's the same business
          if (existingMember.business_id === businessId) {
            return NextResponse.json({ 
              error: "This user is already a member of your organization" 
            }, { status: 400 });
          } else {
            return NextResponse.json({ 
              error: "This user is already a member of another organization" 
            }, { status: 400 });
          }
        }

        // Update user name if provided and user exists
        if (name && targetUser.id) {
            await admin.auth.admin.updateUserById(targetUser.id, {
                 user_metadata: { full_name: name }
             });
        }
      }

      // Insert membership using admin client
      const { data: newMembership, error: insErr } = await admin
        .from("memberships")
        .insert({
          business_id: businessId,
          role: invRole,
          status: 'pending',
          invitation_email: email,
          invitation_name: inviteeName || null,
          user_id: targetUser ? targetUser.id : null
        })
        .select("id, token, invitation_name")
        .maybeSingle();
      
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });
      membershipId = newMembership?.id || null;
      token = newMembership?.token || null;
      if (!inviteeName && newMembership?.invitation_name) {
        inviteeName = newMembership.invitation_name;
      }
  }

  // Send invitation email
  if (!token) {
    console.warn("[invite-email] Missing token, skipping invite email", { email, membershipId });
  } else if (!process.env.RESEND_API_KEY) {
    console.warn("[invite-email] RESEND_API_KEY missing; invite email not sent", { email });
  } else {
    const { data: biz } = await admin.from("businesses").select("name").eq("id", businessId).single();
    const businessName = biz?.name || "Our Business";
    const acceptUrl = `${SITE_URL}/invite/${token}`;

    try {
      const sendResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'WaitQ <noreply@waitq.com>',
        replyTo: process.env.RESEND_REPLY_TO_EMAIL,
        to: email,
        subject: `You've been invited to join ${businessName} on WaitQ`,
        html: buildInviteEmailHtml({
          recipientName: inviteeName || name,
          businessName,
          acceptUrl,
        }),
      });
      const messageId = (sendResult as any)?.id || (sendResult as any)?.data?.id || null;
      console.log("[invite-email] Invite email sent", { email, membershipId, messageId });
    } catch (err) {
      console.error("[invite-email] Failed to send invite email", { email, membershipId, error: err });
    }
  }

  return NextResponse.json({ ok: true, membership: { id: membershipId, email, role: invRole, status: 'pending', name: inviteeName || null } });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { membershipId } = await req.json().catch(() => ({}));
  if (!membershipId || typeof membershipId !== 'string') return NextResponse.json({ error: "Missing membershipId" }, { status: 400 });

  const businessId = await resolveBusinessId(user.id);
  if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 400 });

  // Safety checks: cannot remove owner/admin membership
  const admin = getAdminClient();
  const { data: m } = await admin
    .from("memberships")
    .select("id, user_id, role")
    .eq("id", membershipId)
    .eq("business_id", businessId)
    .maybeSingle();
  const { data: biz } = await admin.from("businesses").select("owner_user_id").eq("id", businessId).maybeSingle();
  if (!m || !biz) return NextResponse.json({ error: "Invalid membership" }, { status: 400 });
  const isOwnerMembership = (m.user_id as string) === (biz.owner_user_id as string);
  if (isOwnerMembership || m.role === 'admin') return NextResponse.json({ error: "Cannot remove admin user" }, { status: 400 });

  const { error: delErr } = await admin.from("memberships").delete().eq("id", membershipId).eq("business_id", businessId);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
    const supabase = await createRouteClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { membershipId, role, name } = await req.json().catch(() => ({}));
    if (!membershipId) return NextResponse.json({ error: "Missing membershipId" }, { status: 400 });

    const businessId = await resolveBusinessId(user.id);
    if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 400 });

    const admin = getAdminClient();
    
    // Verify permission (only admin/owner can edit)
    const { data: biz } = await admin.from("businesses").select("owner_user_id").eq("id", businessId).single();
    const isOwner = biz?.owner_user_id === user.id;
    const { data: me } = await admin.from("memberships").select("role").eq("business_id", businessId).eq("user_id", user.id).single();
    
    if (!isOwner && me?.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get target membership
    const { data: target } = await admin
      .from("memberships")
      .select("user_id, role, invitation_name")
      .eq("id", membershipId)
      .eq("business_id", businessId)
      .single();
    if (!target) return NextResponse.json({ error: "Membership not found" }, { status: 404 });

    const targetIsOwner = target.user_id === biz?.owner_user_id;
    
    // Updates
    const updates: any = {};
    
    // Update role if provided and not owner
    if (role && !targetIsOwner && target.role !== 'admin') {
         // Validate role
         if (validateRole(role)) {
             updates.role = role;
         }
    }

    // Update role if allowed
    if (Object.keys(updates).length > 0) {
        const { error: upErr } = await admin.from("memberships").update(updates).eq("id", membershipId);
        if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    const trimmedName = typeof name === "string" ? name.trim() : undefined;
    if (trimmedName !== undefined) {
      if (target.user_id) {
        const { error: nameErr } = await admin.auth.admin.updateUserById(target.user_id, {
          user_metadata: { full_name: trimmedName || null, name: trimmedName || null },
        });
        if (nameErr) {
          console.error("Failed to update user name", nameErr);
          return NextResponse.json({ error: "Failed to update user name" }, { status: 500 });
        }
      } else {
        const { error: inviteNameErr } = await admin
          .from("memberships")
          .update({ invitation_name: trimmedName || null })
          .eq("id", membershipId);
        if (inviteNameErr) {
          console.error("Failed to update pending invite name", inviteNameErr);
          return NextResponse.json({ error: inviteNameErr.message }, { status: 400 });
        }
      }
    }

    return NextResponse.json({ ok: true });
}
