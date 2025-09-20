import twilio from "twilio";

export function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio credentials missing");
  return twilio(sid, token);
}

export async function sendSms(to: string, body: string) {
  const client = getTwilioClient();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!messagingServiceSid) throw new Error("TWILIO_MESSAGING_SERVICE_SID missing");
  await client.messages.create({ to, body, messagingServiceSid });
}


