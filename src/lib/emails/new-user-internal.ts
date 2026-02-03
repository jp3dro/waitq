type NewUserInternalEmailParams = {
  userId: string;
  email: string | null;
  provider?: string | null;
  createdAt?: string | null;
  name?: string | null;
  siteUrl?: string | null;
};

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderNewUserInternalEmail({
  userId,
  email,
  provider,
  createdAt,
  name,
  siteUrl,
}: NewUserInternalEmailParams) {
  const safeEmail = email ? escapeHtml(email) : "(no email)";
  const safeName = name ? escapeHtml(name) : "—";
  const safeProvider = provider ? escapeHtml(provider) : "—";
  const safeCreatedAt = createdAt ? escapeHtml(createdAt) : "—";
  const safeUserId = escapeHtml(userId);
  const safeSiteUrl = siteUrl ? escapeHtml(siteUrl) : "—";

  const subject = `New WaitQ signup: ${email || userId}`;

  const text = [
    "New user signed up",
    "",
    `Email: ${email || "—"}`,
    `Name: ${name || "—"}`,
    `Provider: ${provider || "—"}`,
    `User ID: ${userId}`,
    `Created at: ${createdAt || "—"}`,
    `Site: ${siteUrl || "—"}`,
  ].join("\n");

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <div style="padding:24px 12px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="padding:18px 20px;border-bottom:1px solid #e5e7eb;">
          <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;font-weight:600;">
            WaitQ • Internal
          </div>
          <div style="margin-top:8px;font-size:18px;font-weight:700;color:#111827;">
            New user signed up
          </div>
          <div style="margin-top:4px;font-size:13px;color:#6b7280;">
            A new account was created in WaitQ.
          </div>
        </div>

        <div style="padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 10px;">
            <tr>
              <td style="width:140px;font-size:12px;color:#6b7280;">Email</td>
              <td style="font-size:13px;color:#111827;font-weight:600;">${safeEmail}</td>
            </tr>
            <tr>
              <td style="width:140px;font-size:12px;color:#6b7280;">Name</td>
              <td style="font-size:13px;color:#111827;">${safeName}</td>
            </tr>
            <tr>
              <td style="width:140px;font-size:12px;color:#6b7280;">Provider</td>
              <td style="font-size:13px;color:#111827;">${safeProvider}</td>
            </tr>
            <tr>
              <td style="width:140px;font-size:12px;color:#6b7280;">User ID</td>
              <td style="font-size:13px;color:#111827;"><code style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:12px;background:#f3f4f6;padding:2px 6px;border-radius:8px;">${safeUserId}</code></td>
            </tr>
            <tr>
              <td style="width:140px;font-size:12px;color:#6b7280;">Created at</td>
              <td style="font-size:13px;color:#111827;">${safeCreatedAt}</td>
            </tr>
            <tr>
              <td style="width:140px;font-size:12px;color:#6b7280;">Site</td>
              <td style="font-size:13px;color:#111827;">${safeSiteUrl}</td>
            </tr>
          </table>

          <div style="margin-top:14px;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
            <div style="font-size:12px;color:#6b7280;">
              Tip: You can search this user in Supabase Auth by email or user ID.
            </div>
          </div>
        </div>

        <div style="padding:14px 20px;border-top:1px solid #e5e7eb;background:#fafafa;font-size:12px;color:#6b7280;">
          This is an automated internal notification from WaitQ.
        </div>
      </div>
    </div>
  </body>
</html>`;

  return { subject, html, text };
}

