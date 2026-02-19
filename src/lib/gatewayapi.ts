import { parsePhoneNumberFromString } from "libphonenumber-js";

export type GatewayApiResponse = {
  msg_id: string;
  recipient: number;
  reference?: string;
};

function getToken() {
  const token = process.env.GATEWAYAPI_TOKEN;
  if (!token) {
    throw new Error("GatewayAPI credentials missing: set GATEWAYAPI_TOKEN");
  }
  return token;
}

function normalizeNumber(num: string): string {
  const raw = String(num || "").trim();
  if (!raw) throw new Error("Phone number is required");

  // Try robust parsing first
  const defaultCountry = (process.env.GATEWAYAPI_DEFAULT_COUNTRY || process.env.BULKGATE_DEFAULT_COUNTRY || "").toUpperCase() || undefined; // ISO 3166-1 alpha-2
  const parsed = raw.startsWith("+")
    ? parsePhoneNumberFromString(raw)
    : parsePhoneNumberFromString(raw, defaultCountry as any);

  if (!parsed || !parsed.isValid()) {
    throw new Error(`Invalid phone number: ${raw}${defaultCountry ? ` (default country ${defaultCountry})` : ""}`);
  }

  // GatewayAPI expects MSISDN format (international format without leading '+')
  // Return as numeric string (will be converted to number in the API call)
  return parsed.number.replace(/^\+/, "");
}

/**
 * Send an SMS via GatewayAPI Mobile Messaging API
 * 
 * @param to - Phone number in E.164 format (with or without +) or local format
 * @param text - Message text
 * @param opts - Optional parameters (variables are ignored, kept for compatibility)
 * @returns Promise with GatewayAPI response containing msg_id
 */
export async function sendSms(
  to: string,
  text: string,
  opts?: { variables?: Record<string, string> }
): Promise<GatewayApiResponse> {
  const token = getToken();
  const originalNumber = to;
  const normalizedNumber = normalizeNumber(to);
  
  // Convert normalized number (string without +) to integer for GatewayAPI
  const recipient = parseInt(normalizedNumber, 10);
  if (isNaN(recipient)) {
    throw new Error(`Invalid phone number format: ${normalizedNumber}`);
  }

  const sender = process.env.GATEWAYAPI_SENDER || "WaitQ";
  const url = "https://messaging.gatewayapi.com/mobile/single";

  const payload: {
    sender: string;
    message: string;
    recipient: number;
    reference?: string;
  } = {
    sender,
    message: text,
    recipient,
  };

  // Add reference if provided in variables (for tracking)
  if (opts?.variables?.reference) {
    payload.reference = opts.variables.reference;
  }

  console.log("[GatewayAPI] Sending SMS", {
    originalNumber,
    normalizedNumber,
    recipient,
    textLength: text.length,
    sender,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const raw = await res.text().catch(() => "");
    let json: GatewayApiResponse | null = null;
    try {
      json = raw ? (JSON.parse(raw) as GatewayApiResponse) : null;
    } catch (e) {
      // Invalid JSON
    }

    if (!res.ok) {
      console.error("[GatewayAPI] HTTP error", { status: res.status, body: raw || json });
      const errorMessage = json && typeof json === "object" && "error" in json
        ? String((json as any).error)
        : `HTTP ${res.status}`;
      throw new Error(`GatewayAPI error: ${errorMessage}`);
    }

    if (!json || !json.msg_id) {
      console.error("[GatewayAPI] Invalid response", json ?? raw);
      throw new Error("GatewayAPI did not return a valid msg_id");
    }

    console.log("[GatewayAPI] SMS result", json);
    return json;
  } catch (error) {
    console.error("[GatewayAPI] SMS send failed", {
      originalNumber,
      normalizedNumber,
      recipient,
      error: (error as Error)?.message,
    });
    throw error;
  }
}
