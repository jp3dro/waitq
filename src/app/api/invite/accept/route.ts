import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { createRouteClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminClient();
  
  const { data: membership } = await admin
    .from("memberships")
    .select("id, invitation_email, role, business_id")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });

  // Verify user email matches invite email (optional security check)
  if (membership.invitation_email && membership.invitation_email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: "Invite email does not match logged in user" }, { status: 400 });
  }

  // Accept invite
  const { error } = await admin
    .from("memberships")
    .update({ 
        status: "active", 
        user_id: user.id, 
        invitation_email: null, // clear invitation email as it's now linked
        token: null // clear token to prevent reuse
    })
    .eq("id", membership.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Skip onboarding for invited members
  try {
    await admin
      .from("profiles")
      .upsert({ id: user.id, onboarding_completed: true, onboarding_step: 5 }, { onConflict: "id" });
  } catch { }

  return NextResponse.json({ ok: true });
}

