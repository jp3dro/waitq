import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { renderNewUserInternalEmail } from "@/lib/emails/new-user-internal";

export async function POST(req: Request) {
  // Safety: only allow in non-production environments unless a token is provided.
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const expected = process.env.INTERNAL_EMAIL_TEST_TOKEN || "";

  if (process.env.NODE_ENV === "production" && (!expected || token !== expected)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Partial<{
    to: string;
    userId: string;
    email: string;
    name: string;
    provider: string;
  }>;

  const { subject, html, text } = renderNewUserInternalEmail({
    userId: body.userId || "00000000-0000-0000-0000-000000000000",
    email: body.email || "test.user@example.com",
    name: body.name || "Test User",
    provider: body.provider || "email",
    createdAt: new Date().toISOString(),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  });

  const from =
    process.env.RESEND_FROM_INTERNAL ||
    (process.env.NODE_ENV === "production"
      ? "WaitQ <noreply@waitq.app>"
      : "WaitQ <onboarding@resend.dev>");

  const to = body.to || process.env.INTERNAL_SIGNUP_NOTIFY_TO || "joao@azor.studio";
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `[TEST] ${subject}`,
    html,
    text,
  });

  if (error) {
    console.error("[test-email] Resend error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

