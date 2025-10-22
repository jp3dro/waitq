export type BulkGateAdvancedResponse = {
  data?: Record<string, unknown> | undefined;
  type?: string;
  code?: number;
  error?: string;
  detail?: unknown;
};

function getCredentials() {
  const applicationId = process.env.BULKGATE_APPLICATION_ID;
  const applicationToken = process.env.BULKGATE_APPLICATION_TOKEN;
  if (!applicationId || !applicationToken) {
    throw new Error("BulkGate credentials missing: set BULKGATE_APPLICATION_ID and BULKGATE_APPLICATION_TOKEN");
  }
  return { applicationId, applicationToken };
}

function normalizeNumber(num: string) {
  // Advanced v2 accepts international format; commonly without '+'. Remove spaces and leading '+'
  return num.replace(/\s+/g, "").replace(/^\+/, "");
}

function buildSmsChannel() {
  const senderId = process.env.BULKGATE_SMS_SENDER_ID; // e.g. gSystem, gText, gOwn, gProfile
  const senderIdValue = process.env.BULKGATE_SMS_SENDER_ID_VALUE || undefined;
  const unicode = ["1", "true", "yes"].includes(String(process.env.BULKGATE_SMS_UNICODE || "").toLowerCase()) || undefined;
  const sms: Record<string, unknown> = {};
  if (senderId) sms.sender_id = senderId;
  if (senderIdValue) sms.sender_id_value = senderIdValue;
  if (typeof unicode === "boolean") sms.unicode = unicode;
  return Object.keys(sms).length ? sms : undefined;
}

function buildWhatsappChannel(text: string, templateParams?: string[]) {
  const sender = process.env.BULKGATE_WHATSAPP_SENDER; // required by WhatsApp channel
  if (!sender) return undefined;
  const expiration = Number(process.env.BULKGATE_WHATSAPP_EXPIRATION || "300");
  const templateName = process.env.BULKGATE_WHATSAPP_TEMPLATE_NAME;
  const templateLanguage = process.env.BULKGATE_WHATSAPP_TEMPLATE_LANGUAGE;
  let message: Record<string, unknown> = { text };
  if (templateName && templateLanguage) {
    message = {
      template: {
        name: templateName,
        language: templateLanguage,
        components: [
          {
            type: "body",
            parameters: (templateParams || []).map((p) => ({ type: "text", text: p })),
          },
        ],
      },
    };
  }
  return {
    sender,
    expiration,
    message,
  };
}

async function postAdvanced(payload: Record<string, unknown>): Promise<BulkGateAdvancedResponse> {
  const url = "https://portal.bulkgate.com/api/2.0/advanced/transactional";
  console.log("[BulkGate] Request", { url, payload: { ...payload, application_token: "[redacted]" } });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const raw = await res.text().catch(() => "");
  let json: BulkGateAdvancedResponse | null = null;
  try { json = raw ? (JSON.parse(raw) as BulkGateAdvancedResponse) : null; } catch {}
  if (!res.ok) {
    console.error("[BulkGate] HTTP error", { status: res.status, body: raw || json });
    const type = json?.type; const code = json?.code; const error = json?.error; const detail = json?.detail;
    const reason = type || error || `HTTP ${res.status}`;
    throw new Error(`BulkGate error: ${reason}${code ? ` (code ${code})` : ""}${detail ? ` - ${JSON.stringify(detail)}` : ""}`);
  }
  console.log("[BulkGate] Response", json ?? raw);
  return (json ?? {}) as BulkGateAdvancedResponse;
}

export async function sendSms(
  to: string,
  text: string,
  opts?: { variables?: Record<string, string> }
): Promise<BulkGateAdvancedResponse> {
  const { applicationId, applicationToken } = getCredentials();
  const originalNumber = to;
  const number = normalizeNumber(to);
  const country = process.env.BULKGATE_DEFAULT_COUNTRY || undefined; // ISO 3166-1 alpha-2
  const smsChannel = buildSmsChannel();
  const channel: Record<string, unknown> = {};
  if (smsChannel) channel.sms = smsChannel;
  const payload: Record<string, unknown> = {
    application_id: applicationId,
    application_token: applicationToken,
    number,
    text,
  };
  if (country) payload.country = country;
  if (opts?.variables) payload.variables = opts.variables;
  if (Object.keys(channel).length) payload.channel = channel;

  console.log("[BulkGate] Sending SMS", {
    originalNumber,
    normalizedNumber: number,
    country,
    textLength: text.length,
    hasChannel: Object.keys(channel).length > 0
  });

  try {
    const result = await postAdvanced(payload);
    console.log("[BulkGate] SMS result", result);
    return result;
  } catch (error) {
    console.error("[BulkGate] SMS send failed", {
      originalNumber,
      normalizedNumber: number,
      error: (error as Error)?.message
    });
    throw error;
  }
}

export async function sendWhatsapp(to: string, text: string, opts?: { templateParams?: string[]; variables?: Record<string, string> }) {
  const { applicationId, applicationToken } = getCredentials();
  const number = normalizeNumber(to);
  const country = process.env.BULKGATE_DEFAULT_COUNTRY || undefined;
  const whatsapp = buildWhatsappChannel(text, opts?.templateParams);
  const smsChannel = buildSmsChannel(); // optional fallback
  const channel: Record<string, unknown> = {};
  if (whatsapp) channel.whatsapp = whatsapp;
  if (smsChannel) channel.sms = smsChannel;
  const payload: Record<string, unknown> = {
    application_id: applicationId,
    application_token: applicationToken,
    number,
    text,
  };
  if (country) payload.country = country;
  if (opts?.variables) payload.variables = opts.variables;
  if (Object.keys(channel).length) payload.channel = channel;
  return postAdvanced(payload);
}

// Note: getMessageStatus may not be available for all BulkGate plans
// Consider using webhooks for delivery status instead
export async function getMessageStatus(messageId: string): Promise<BulkGateAdvancedResponse> {
  const { applicationId, applicationToken } = getCredentials();
  const payload: Record<string, unknown> = {
    application_id: applicationId,
    application_token: applicationToken,
    message_id: messageId,
  };
  return postAdvanced(payload);
}

// Alternative: Check delivery reports via different endpoint if available
export async function getDeliveryReport(messageId: string): Promise<BulkGateAdvancedResponse> {
  // Some BulkGate APIs use different endpoints for delivery reports
  const url = "https://portal.bulkgate.com/api/2.0/advanced/delivery-report";
  const { applicationId, applicationToken } = getCredentials();

  console.log("[BulkGate] Checking delivery report", { messageId });

  const payload: Record<string, unknown> = {
    application_id: applicationId,
    application_token: applicationToken,
    message_id: messageId,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await res.text().catch(() => "");
  let json: BulkGateAdvancedResponse | null = null;
  try { json = raw ? (JSON.parse(raw) as BulkGateAdvancedResponse) : null; } catch {}

  if (!res.ok) {
    console.error("[BulkGate] Delivery report HTTP error", { status: res.status, body: raw || json });
    const type = json?.type; const code = json?.code; const error = json?.error; const detail = json?.detail;
    const reason = type || error || `HTTP ${res.status}`;
    throw new Error(`BulkGate delivery report error: ${reason}${code ? ` (code ${code})` : ""}${detail ? ` - ${JSON.stringify(detail)}` : ""}`);
  }

  console.log("[BulkGate] Delivery report response", json ?? raw);
  return (json ?? {}) as BulkGateAdvancedResponse;
}


