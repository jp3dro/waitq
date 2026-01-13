import { NextRequest, NextResponse } from "next/server";
import { BulkGateAdvancedResponse, getMessageStatus, sendSms } from "@/lib/bulkgate";
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
  const messageId = searchParams.get("messageId");
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

  if (!messageId) {
    return NextResponse.json({ error: "Missing messageId parameter" }, { status: 400 });
  }

  try {
    const status = await getMessageStatus(messageId);
    return NextResponse.json({ messageId, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error checking BulkGate status:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function runDiagnostics(phone?: string) {
  const results: DiagnosticResults = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // Test 1: Check message status for the problematic message
    results.tests.push({
      name: "Check problematic message status",
      messageId: "sms-fsrm7q97ayga",
      status: "running"
    });

    try {
      const status = await getMessageStatus("sms-fsrm7q97ayga");
      results.tests[0].status = "success";
      results.tests[0].result = status;
    } catch (error) {
      results.tests[0].status = "failed";
      results.tests[0].error = error instanceof Error ? error.message : String(error);
    }

    // Optional: Send test SMS only when explicitly requested with a phone number.
    if (phone) {
      results.tests.push({
        name: "Send test SMS",
        phone,
        status: "running"
      });

      try {
        const testResult: BulkGateAdvancedResponse = await sendSms(phone, "WaitQ diagnostic test - please ignore");
        results.tests[1].status = "success";
        results.tests[1].result = testResult;

        // Test 3: Check status of the test message
        const testMessageId = typeof testResult.data === "object" && testResult.data && "message_id" in testResult.data
          ? String((testResult.data as Record<string, unknown>)["message_id"] ?? "")
          : "";
        if (testMessageId) {
          results.tests.push({
            name: "Check test message status",
            messageId: testMessageId,
            status: "running"
          });

          // Wait a bit before checking status
          await new Promise(resolve => setTimeout(resolve, 3000));

          try {
            const testStatus = await getMessageStatus(testMessageId);
            results.tests[2].status = "success";
            results.tests[2].result = testStatus;
          } catch (error) {
            results.tests[2].status = "failed";
            results.tests[2].error = error instanceof Error ? error.message : String(error);
          }
        }
      } catch (error) {
        results.tests[1].status = "failed";
        results.tests[1].error = error instanceof Error ? error.message : String(error);
      }
    } else {
      results.tests.push({
        name: "Send test SMS (skipped)",
        status: "success",
        result: "Provide ?phone=E164_NUMBER to run SMS send test"
      });
    }

  } catch (error) {
    results.error = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(results);
}
