import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isEuCountry } from "@/lib/eu";

const schema = z.object({
  countryCode: z.string().min(2).max(2),
  vatId: z.string().min(4),
});

function sanitizeVat(v: string) {
  return v.replace(/\s+/g, "").toUpperCase();
}

function extractCountryAndNumber(inputCountry: string, vatId: string) {
  const raw = sanitizeVat(vatId);
  const cc = raw.slice(0, 2);
  const input = sanitizeVat(inputCountry);
  if (/^[A-Z]{2}$/.test(cc)) {
    return { countryCode: cc, vatNumber: raw.slice(2).replace(/[^A-Z0-9]/g, "") };
  }
  return { countryCode: input, vatNumber: raw.replace(/[^A-Z0-9]/g, "") };
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parse = schema.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const { countryCode: inputCountry, vatId } = parse.data;
  const { countryCode, vatNumber } = extractCountryAndNumber(inputCountry, vatId);

  if (!isEuCountry(countryCode)) {
    return NextResponse.json({ valid: false, countryCode, vatNumber, reason: "Country is not in the EU" });
  }
  if (!vatNumber || vatNumber.length < 4) {
    return NextResponse.json({ valid: false, countryCode, vatNumber, reason: "VAT number is too short" });
  }

  // VIES SOAP endpoint
  const endpoint = "https://ec.europa.eu/taxation_customs/vies/services/checkVatService";
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soap:Body>
    <tns:checkVat>
      <tns:countryCode>${countryCode}</tns:countryCode>
      <tns:vatNumber>${vatNumber}</tns:vatNumber>
    </tns:checkVat>
  </soap:Body>
</soap:Envelope>`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8" },
      body,
      cache: "no-store",
    });
    const text = await res.text();

    // Basic parsing (VIES returns <valid>true|false</valid>, plus optional <name>, <address>)
    const validMatch = text.match(/<valid>\s*(true|false)\s*<\/valid>/i);
    const valid = validMatch?.[1]?.toLowerCase() === "true";
    const name = (text.match(/<name>\s*([\s\S]*?)\s*<\/name>/i)?.[1] || "").trim() || null;
    const address = (text.match(/<address>\s*([\s\S]*?)\s*<\/address>/i)?.[1] || "").trim() || null;

    // VIES sometimes returns SOAP faults or non-standard payloads (service unavailable, member state down, etc).
    // Treat these as a non-fatal "unavailable" result so the UI can show a helpful message.
    if (!res.ok || !validMatch) {
      const fault = (text.match(/<faultstring>\s*([\s\S]*?)\s*<\/faultstring>/i)?.[1] || "").trim();
      const normalized = fault || "";
      const reason =
        normalized
          ? `VIES unavailable: ${normalized}`
          : "VIES is temporarily unavailable. Please try again in a few minutes.";
      return NextResponse.json({ valid: null, countryCode, vatNumber, reason });
    }

    return NextResponse.json({ valid, countryCode, vatNumber, name, address });
  } catch (e) {
    return NextResponse.json({
      valid: null,
      countryCode,
      vatNumber,
      reason: (e as Error).message || "VIES request failed",
    });
  }
}

