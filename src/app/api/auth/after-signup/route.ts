import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";
import { renderNewUserInternalEmail } from "@/lib/emails/new-user-internal";

/**
 * Called after a successful signUp that immediately returns a session (i.e. no email confirmation).
 * Ensures a profile row exists and sends an internal notification email exactly once.
 */
export async function POST(req: Request) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If the profile exists, assume we've already notified.
  const existing = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (existing.data?.id) {
    return NextResponse.json({ ok: true, sent: false, reason: "profile_exists" });
  }

  // Create profile row (best-effort; tolerate schema-cache edge cases)
  const ins = await supabase.from("profiles").insert({ id: user.id });
  if (ins.error && !String(ins.error.message || "").toLowerCase().includes("duplicate")) {
    console.error("[after-signup] Failed to create profile:", ins.error);
    // Still attempt to send internal email; the app can create the profile later.
  }

  try {
    const from =
      process.env.RESEND_FROM_INTERNAL ||
      (process.env.NODE_ENV === "production"
        ? "WaitQ <noreply@waitq.app>"
        : "WaitQ <onboarding@resend.dev>");
    const { subject, html, text } = renderNewUserInternalEmail({
      userId: user.id,
      email: user.email ?? null,
      name: (user.user_metadata as any)?.full_name ?? (user.user_metadata as any)?.name ?? null,
      provider: (user.app_metadata as any)?.provider ?? null,
      createdAt: (user as any)?.created_at ?? null,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
    });

    const to = process.env.INTERNAL_SIGNUP_NOTIFY_TO || "joao@azor.studio";
    await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });
  } catch (e) {
    console.error("[internal-email] Failed to notify new user signup:", e);
    return NextResponse.json({ ok: false, error: "Failed to send internal email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sent: true });
}

