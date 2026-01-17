import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

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

function buildResetPasswordEmailHtml({
  resetUrl,
}: {
  resetUrl: string;
}) {
  const accent = "#FF9500";
  const accentText = "#111827";
  const safeResetUrl = escapeHtml(resetUrl);
  const heroUrl = `${SITE_URL}/waitq-variant.png`;

  return `
  <body style="margin:0;background-color:#f8fafc;padding:32px 0;font-family:'Inter', 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;padding:0 24px;">
            <tr>
              <td>
                <div style="background-color:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 25px 45px rgba(15,23,42,0.12);">
                  <img src="${heroUrl}" alt="WaitQ" width="100%" style="display:block;max-height:240px;object-fit:cover;" />
                  <div style="padding:32px 36px 24px;">
                    <div style="text-transform:uppercase;font-size:12px;letter-spacing:2px;font-weight:600;color:${accent};">Password reset</div>
                    <h1 style="margin:14px 0 16px;font-size:26px;line-height:1.3;color:#0f172a;">Reset your WaitQ password</h1>
                    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#475569;">
                      We received a request to reset your password. Click the button below to set a new one.
                    </p>
                    <div style="margin:28px 0;">
                      <a href="${safeResetUrl}" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 32px;border-radius:999px;background-color:${accent};color:${accentText};font-weight:600;text-decoration:none;border:1px solid #ea580c;box-shadow:0 10px 20px rgba(255,149,0,0.25);">Reset password</a>
                    </div>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
                      If you didn’t request this, you can safely ignore this email.
                      If the button doesn’t work, copy and paste this link:<br />
                      <a href="${safeResetUrl}" style="color:${accentText};text-decoration:underline;">${safeResetUrl}</a>
                    </p>
                  </div>
                  <div style="padding:20px 36px 36px;border-top:1px solid #f1f5f9;background-color:#fff7ed;">
                    <p style="margin:0;font-size:14px;color:#b45309;line-height:1.5;">
                      Need help? Reply directly or email <a href="mailto:support@waitq.com" style="color:${accentText};text-decoration:none;font-weight:600;">support@waitq.com</a>.
                    </p>
                  </div>
                </div>
                <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;line-height:1.5;">Powered by WaitQ • ${SITE_URL.replace(/^https?:\/\//, "")}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  `;
}

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";

  // Always return a generic ok response to prevent account enumeration.
  const okResponse = NextResponse.json({ ok: true });

  if (!normalized || !normalized.includes("@")) return okResponse;

  try {
    const admin = getAdminClient();
    const redirectTo = `${SITE_URL}/auth/callback?next=/reset-password`;
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: normalized,
      options: { redirectTo },
    });
    // If the email is not associated with an account, Supabase will error here.
    // We still return a generic ok response.
    if (error) return okResponse;

    const actionLink =
      (data as any)?.properties?.action_link ||
      (data as any)?.action_link ||
      (data as any)?.properties?.actionLink ||
      null;

    if (!actionLink || typeof actionLink !== "string") return okResponse;

    if (!process.env.RESEND_API_KEY) {
      console.warn("[password-recover] RESEND_API_KEY missing; reset email not sent", { email: normalized });
      return okResponse;
    }

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "WaitQ <noreply@waitq.com>",
      replyTo: process.env.RESEND_REPLY_TO_EMAIL,
      to: normalized,
      subject: "Reset your WaitQ password",
      html: buildResetPasswordEmailHtml({ resetUrl: actionLink }),
    });
  } catch (err) {
    console.error("[password-recover] Failed to send reset email", { email: normalized, error: err });
  }

  return okResponse;
}

