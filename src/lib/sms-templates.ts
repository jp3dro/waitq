/**
 * SMS message templates.
 *
 * Edit these functions to change the text customers receive via SMS.
 * Each function receives context about the business and ticket and returns
 * a plain-text string (SMS messages don't support formatting).
 *
 * Keep messages short — every SMS segment is ~160 characters.
 */

type MessageContext = {
  businessName?: string | null;
  ticketNumber?: number | null;
  statusUrl: string;
};

/** Sent when a customer is first added to the waitlist. */
export function joinedMessage(ctx: MessageContext) {
  const biz = (ctx.businessName || "").trim();
  const ticket = ctx.ticketNumber ? `${ctx.ticketNumber}` : "";

  const text = [
    biz ? `${biz}:` : null,
    `number ${ticket} on the list.`,
    `Follow it live here: ${ctx.statusUrl}`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    text,
    variables: { brand: biz, ticket: String(ctx.ticketNumber || ""), link: ctx.statusUrl },
    templateParams: [biz, String(ctx.ticketNumber || ""), ctx.statusUrl],
  };
}

/** Sent when the restaurant calls / notifies a customer that it's their turn. */
export function calledMessage(ctx: MessageContext) {
  const biz = (ctx.businessName || "").trim();
  const ticket = ctx.ticketNumber ? `${biz ? "" : "number "}${ctx.ticketNumber}` : "";

  const text = [
    biz ? `${biz}:` : null,
    `It's your turn! Show your number ${ticket} to the staff.`
  ]
    .filter(Boolean)
    .join(" ");

  return {
    text,
    variables: { brand: biz, ticket: String(ctx.ticketNumber || ""), link: ctx.statusUrl },
    templateParams: [biz, String(ctx.ticketNumber || ""), ctx.statusUrl],
  };
}
