function escapeHtml(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function brandShell(opts: {
  title: string;
  preheader?: string | null;
  bodyHtml: string;
  footerHtml?: string | null;
  siteUrl: string;
}) {
  const safeTitle = escapeHtml(opts.title);
  const safeSite = escapeHtml(opts.siteUrl);
  const safeHost = safeSite.replace(/^https?:\/\//, "");
  const preheader = escapeHtml((opts.preheader || "").trim());
  const logoUrl = `${safeSite}/waitq-variant.png`;

  // Notes:
  // - Email clients don't support Tailwind/Shadcn; we mimic the marketing brand with inline styles.
  // - Use a dark hero background like the homepage and a simple card for content.
  return `
  <body style="margin:0;background-color:#0b0b0b;padding:32px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>` : ""}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;padding:0 24px;">
            <tr>
              <td style="padding:8px 0 20px;">
                <img src="${logoUrl}" alt="WaitQ" width="108" height="32" style="display:block;height:32px;width:auto;margin:0 auto;" />
              </td>
            </tr>
            <tr>
              <td>
                <div style="background-color:#ffffff;border-radius:20px;overflow:hidden;border:1px solid rgba(148,163,184,0.25);box-shadow:0 22px 44px rgba(0,0,0,0.35);">
                  <div style="padding:28px 28px 6px;">
                    <h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;color:#0f172a;">${safeTitle}</h1>
                  </div>
                  <div style="padding:0 28px 24px;">
                    ${opts.bodyHtml}
                  </div>
                  ${opts.footerHtml ? `<div style="padding:18px 28px;border-top:1px solid #eef2f7;background-color:#f8fafc;">${opts.footerHtml}</div>` : ""}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 0 0;text-align:center;color:#9ca3af;font-size:12px;line-height:1.5;">
                © ${new Date().getFullYear()} WaitQ • ${safeHost}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  `;
}

export function buildInviteEmailHtml(opts: {
  recipientName?: string | null;
  businessName: string;
  acceptUrl: string;
  siteUrl: string;
}) {
  const safeBiz = escapeHtml(opts.businessName);
  const safeName = escapeHtml(opts.recipientName);
  const safeAcceptUrl = escapeHtml(opts.acceptUrl);
  const greeting = safeName ? `Hi ${safeName},` : "Hi there,";

  const bodyHtml = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">
      ${greeting} <strong style="color:#0f172a;">${safeBiz}</strong> invited you to join their WaitQ workspace.
    </p>
    <div style="margin:18px 0 18px;text-align:center;">
      <a href="${safeAcceptUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background-color:#FF9500;color:#111827;font-weight:700;text-decoration:none;border:1px solid #ea580c;">
        Accept invite
      </a>
    </div>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
      This invite expires in 48 hours. If the button doesn't work, copy and paste this link:
      <br />
      <a href="${safeAcceptUrl}" style="color:#0f172a;text-decoration:underline;">${safeAcceptUrl}</a>
    </p>
  `;

  const footerHtml = `
    <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">
      Need help? Reply to this email or contact <a href="mailto:support@waitq.com" style="color:#0f172a;text-decoration:none;font-weight:700;">support@waitq.com</a>.
    </p>
  `;

  return brandShell({
    title: `Join ${opts.businessName} on WaitQ`,
    preheader: `${opts.businessName} invited you to join WaitQ.`,
    bodyHtml,
    footerHtml,
    siteUrl: opts.siteUrl,
  });
}

export function buildWaitlistTicketEmailHtml(opts: {
  businessName?: string | null;
  waitlistName?: string | null;
  customerName?: string | null;
  ticketNumber?: number | null;
  partySize?: number | null;
  seatingPreference?: string | null;
  statusUrl: string;
  siteUrl: string;
}) {
  const safeBiz = escapeHtml((opts.businessName || "WaitQ").trim());
  const safeList = escapeHtml((opts.waitlistName || "").trim());
  const safeName = escapeHtml((opts.customerName || "").trim());
  const safeUrl = escapeHtml(opts.statusUrl);
  const ticket = typeof opts.ticketNumber === "number" ? `#${opts.ticketNumber}` : "";
  const safeTicket = escapeHtml(ticket);
  const party = typeof opts.partySize === "number" ? String(opts.partySize) : "";
  const safeParty = escapeHtml(party);
  const safePref = escapeHtml((opts.seatingPreference || "").trim());

  const rows = [
    safeList ? { k: "List", v: safeList } : null,
    safeName ? { k: "Name", v: safeName } : null,
    safeParty ? { k: "Party size", v: safeParty } : null,
    safePref ? { k: "Seating", v: safePref } : null,
  ].filter(Boolean) as { k: string; v: string }[];

  const detailsHtml = rows.length
    ? `<div style="margin:14px 0 16px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        ${rows
          .map(
            (r) => `
          <div style="display:flex;gap:10px;justify-content:space-between;padding:10px 12px;border-top:1px solid #e5e7eb;">
            <div style="color:#64748b;font-size:13px;">${escapeHtml(r.k)}</div>
            <div style="color:#0f172a;font-size:13px;font-weight:700;">${r.v}</div>
          </div>`
          )
          .join("")
          .replace('border-top:1px solid #e5e7eb;', '')}
      </div>`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#334155;">
      You're in the queue at <strong style="color:#0f172a;">${safeBiz}</strong> ${safeTicket ? `<strong style="color:#0f172a;">(${safeTicket})</strong>` : ""}.
    </p>
    ${detailsHtml}
    <div style="margin:18px 0 18px;text-align:center;">
      <a href="${safeUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background-color:#FF9500;color:#111827;font-weight:700;text-decoration:none;border:1px solid #ea580c;">
        Open live status
      </a>
    </div>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
      If the button doesn't work, copy and paste this link:
      <br />
      <a href="${safeUrl}" style="color:#0f172a;text-decoration:underline;">${safeUrl}</a>
    </p>
  `;

  return brandShell({
    title: `${safeBiz} ticket ${safeTicket || ""}`.trim(),
    preheader: `${safeBiz} queue update ${safeTicket || ""}`.trim(),
    bodyHtml,
    footerHtml: null,
    siteUrl: opts.siteUrl,
  });
}

