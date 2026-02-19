import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

// GatewayAPI webhook event envelope structure
interface GatewayApiWebhookEnvelope {
  event_id: string;
  timestamp: string;
  event_type: string;
  event: {
    msg_id: string;
    recipient: number;
    reference?: string;
    status: string;
    status_at: string;
    error?: string | null;
  };
}

function verifySignature(body: string, signature: string, secret: string): boolean {
  if (!signature.startsWith("v1=")) {
    return false;
  }

  const providedSignature = signature.slice(3); // Remove "v1=" prefix
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const expectedSignature = hmac.digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(providedSignature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

export async function POST(req: NextRequest) {
  try {
    const configuredSecret = process.env.GATEWAYAPI_WEBHOOK_SECRET;
    if (!configuredSecret) {
      console.error("[GatewayAPI Webhook] GATEWAYAPI_WEBHOOK_SECRET is not set");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("Signature");

    if (!signature) {
      console.warn("[GatewayAPI Webhook] Missing Signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Verify signature
    if (!verifySignature(body, signature, configuredSecret)) {
      console.warn("[GatewayAPI Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the webhook payload
    let envelope: GatewayApiWebhookEnvelope;
    try {
      envelope = JSON.parse(body) as GatewayApiWebhookEnvelope;
    } catch (error) {
      console.error("[GatewayAPI Webhook] Invalid JSON payload", error);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Only process SMS status events
    if (envelope.event_type !== "message.status.sms") {
      console.log("[GatewayAPI Webhook] Ignoring event type", envelope.event_type);
      return NextResponse.json({ success: true, message: "Event type ignored" });
    }

    const event = envelope.event;
    console.log("[GatewayAPI Webhook] Received SMS status event", {
      msg_id: event.msg_id,
      status: event.status,
      recipient: event.recipient,
    });

    const admin = getAdminClient();

    // Map GatewayAPI status to our internal status
    // GatewayAPI statuses: DELIVERED, ENROUTE, EXPIRED, FAILED, etc.
    let internalStatus: 'pending' | 'sent' | 'delivered' | 'failed';

    switch (event.status.toUpperCase()) {
      case 'ENROUTE':
        internalStatus = 'sent';
        break;
      case 'DELIVERED':
        internalStatus = 'delivered';
        break;
      case 'EXPIRED':
      case 'FAILED':
      case 'REJECTED':
        internalStatus = 'failed';
        break;
      default:
        // For unknown statuses, default to 'sent' if it's not a clear failure
        console.warn('[GatewayAPI Webhook] Unknown status:', event.status);
        internalStatus = event.status.toUpperCase().includes('FAIL') || event.status.toUpperCase().includes('ERROR')
          ? 'failed'
          : 'sent';
    }

    // Find the waitlist entry by message_id (stored in sms_message_id)
    const updateData: any = {
      sms_status: internalStatus,
    };

    if (internalStatus === 'sent') {
      updateData.sms_sent_at = new Date().toISOString();
    } else if (internalStatus === 'delivered') {
      updateData.sms_delivered_at = new Date().toISOString();
    } else if (internalStatus === 'failed') {
      updateData.sms_error_message = event.error || `Status: ${event.status}`;
    }

    const { data, error } = await admin
      .from('waitlist_entries')
      .update(updateData)
      .eq('sms_message_id', event.msg_id)
      .select('id, customer_name, ticket_number')
      .single();

    if (error) {
      console.error('[GatewayAPI Webhook] Database update error:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    if (!data) {
      console.warn('[GatewayAPI Webhook] No entry found for msg_id:', event.msg_id);
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Also update the notification_logs table
    const updateLogData: any = {
      status: internalStatus,
      updated_at: new Date().toISOString()
    };

    if (internalStatus === 'delivered') {
      updateLogData.delivered_at = new Date().toISOString();
    } else if (internalStatus === 'failed') {
      updateLogData.error_message = event.error || `Status: ${event.status}`;
    }

    await admin
      .from('notification_logs')
      .update(updateLogData)
      .eq('message_id', event.msg_id);

    console.log(`[GatewayAPI Webhook] Updated SMS status for entry ${data.id} to ${internalStatus}`);

    return NextResponse.json({ success: true, updated: data.id });
  } catch (error) {
    console.error('[GatewayAPI Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint for webhook verification (optional)
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: 'GatewayAPI webhook endpoint active' });
}
