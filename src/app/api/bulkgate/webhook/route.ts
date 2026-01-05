import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

// BulkGate webhook payload structure
interface BulkGateWebhookPayload {
  message_id: string;
  status: 'sent' | 'delivered' | 'failed' | 'accepted' | 'rejected' | 'scheduled' | 'canceled';
  channel: 'sms' | 'whatsapp';
  phone_number: string;
  error_code?: string;
  error_message?: string;
  timestamp?: string;
}

export async function POST(req: NextRequest) {
  try {
    const configuredSecret = process.env.BULKGATE_WEBHOOK_SECRET;
    if (!configuredSecret) {
      console.error("[BulkGate Webhook] BULKGATE_WEBHOOK_SECRET is not set");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const secretFromQuery = searchParams.get("secret");
    const secretFromHeader =
      req.headers.get("x-bulkgate-webhook-secret") ||
      req.headers.get("x-webhook-secret") ||
      (req.headers.get("authorization")?.startsWith("Bearer ") ? req.headers.get("authorization")?.slice("Bearer ".length) : null);

    const providedSecret = secretFromHeader || secretFromQuery;
    if (!providedSecret || providedSecret !== configuredSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: BulkGateWebhookPayload = await req.json();
    console.log("[BulkGate Webhook] Received event", {
      channel: payload.channel,
      status: payload.status,
      message_id: payload.message_id,
    });

    const admin = getAdminClient();

    // Determine if this is SMS or WhatsApp based on the channel
    const isSMS = payload.channel === 'sms';
    const isWhatsApp = payload.channel === 'whatsapp';

    if (!isSMS && !isWhatsApp) {
      console.warn('[BulkGate Webhook] Unknown channel:', payload.channel);
      return NextResponse.json({ error: 'Unknown channel' }, { status: 400 });
    }

    // Map BulkGate status to our internal status
    let internalStatus: 'pending' | 'sent' | 'delivered' | 'failed';

    switch (payload.status) {
      case 'accepted':
      case 'scheduled':
        internalStatus = 'pending';
        break;
      case 'sent':
        internalStatus = 'sent';
        break;
      case 'delivered':
        internalStatus = 'delivered';
        break;
      case 'failed':
      case 'rejected':
      case 'canceled':
        internalStatus = 'failed';
        break;
      default:
        console.warn('[BulkGate Webhook] Unknown status:', payload.status);
        internalStatus = 'failed';
    }

    // Find the waitlist entry by message_id
    const messageIdField = isSMS ? 'sms_message_id' : 'whatsapp_message_id';
    const statusField = isSMS ? 'sms_status' : 'whatsapp_status';
    const sentAtField = isSMS ? 'sms_sent_at' : 'whatsapp_sent_at';
    const deliveredAtField = isSMS ? 'sms_delivered_at' : 'whatsapp_delivered_at';
    const errorField = isSMS ? 'sms_error_message' : 'whatsapp_error_message';

    // Update the waitlist entry
    const updateData: any = {
      [statusField]: internalStatus,
    };

    if (internalStatus === 'sent') {
      updateData[sentAtField] = new Date().toISOString();
    } else if (internalStatus === 'delivered') {
      updateData[deliveredAtField] = new Date().toISOString();
    } else if (internalStatus === 'failed') {
      updateData[errorField] = payload.error_message || `Error code: ${payload.error_code}`;
    }

    const { data, error } = await admin
      .from('waitlist_entries')
      .update(updateData)
      .eq(messageIdField, payload.message_id)
      .select('id, customer_name, ticket_number')
      .single();

    if (error) {
      console.error('[BulkGate Webhook] Database update error:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    if (!data) {
      console.warn('[BulkGate Webhook] No entry found for message_id:', payload.message_id);
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
      updateLogData.error_message = payload.error_message || `Error code: ${payload.error_code}`;
    }

    await admin
      .from('notification_logs')
      .update(updateLogData)
      .eq('message_id', payload.message_id);

    console.log(`[BulkGate Webhook] Updated ${payload.channel} status for entry ${data.id} to ${internalStatus}`);

    return NextResponse.json({ success: true, updated: data.id });
  } catch (error) {
    console.error('[BulkGate Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint for webhook verification (optional)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get('hub.challenge');

  // If this is a webhook verification request, respond with the challenge
  if (challenge) {
    return NextResponse.json({ hub_challenge: challenge });
  }

  return NextResponse.json({ status: 'BulkGate webhook endpoint active' });
}
