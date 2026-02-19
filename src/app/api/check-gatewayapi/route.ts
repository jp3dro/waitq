import { NextRequest, NextResponse } from "next/server";
import { GatewayApiResponse, sendSms } from "@/lib/gatewayapi";
import { createRouteClient } from "@/lib/supabase/server";

type DiagnosticStatus = "running" | "success" | "failed";

interface DiagnosticTest {
  name: string;
  status: DiagnosticStatus;
  messageId?: string;
  phone?: string;
  result?: unknown;
  error?: string;
}

interface DiagnosticResults {
  timestamp: string;
  tests: DiagnosticTest[];
  error?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const phone = searchParams.get("phone") || undefined;

  // Restrict this endpoint to authenticated owner/admins (it can send messages)
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Owner of any business OR active admin membership can access.
  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .limit(1)
    .maybeSingle();

  let isAdmin = !!owned?.id;
  if (!isAdmin) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("id, role, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();
    isAdmin = !!membership?.id;
  }

  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (action === "diagnose") {
    return await runDiagnostics(phone);
  }

  return NextResponse.json({ 
    message: "GatewayAPI diagnostic endpoint",
    usage: "Use ?action=diagnose&phone=+1234567890 to send a test SMS"
  });
}

async function runDiagnostics(phone?: string) {
  const results: DiagnosticResults = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // Optional: Send test SMS only when explicitly requested with a phone number.
    if (phone) {
      results.tests.push({
        name: "Send test SMS",
        phone,
        status: "running"
      });

      try {
        const testResult: GatewayApiResponse = await sendSms(phone, "WaitQ diagnostic test - please ignore");
        results.tests[0].status = "success";
        results.tests[0].result = testResult;
        results.tests[0].messageId = testResult.msg_id;
        
        results.tests.push({
          name: "Test message sent successfully",
          messageId: testResult.msg_id,
          status: "success",
          result: {
            msg_id: testResult.msg_id,
            recipient: testResult.recipient,
            note: "Message status updates will be delivered via webhook"
          }
        });
      } catch (error) {
        results.tests[0].status = "failed";
        results.tests[0].error = error instanceof Error ? error.message : String(error);
      }
    } else {
      results.tests.push({
        name: "Send test SMS (skipped)",
        status: "success",
        result: "Provide ?action=diagnose&phone=E164_NUMBER to run SMS send test"
      });
    }

  } catch (error) {
    results.error = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(results);
}
