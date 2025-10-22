import { NextRequest, NextResponse } from "next/server";
import { BulkGateAdvancedResponse, getMessageStatus, sendSms } from "@/lib/bulkgate";

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

  if (action === "diagnose") {
    return await runDiagnostics();
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

async function runDiagnostics() {
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

    // Test 2: Send test SMS
    results.tests.push({
      name: "Send test SMS",
      phone: "351915558354",
      status: "running"
    });

    try {
      const testResult: BulkGateAdvancedResponse = await sendSms("351915558354", "WaitQ diagnostic test - please ignore");
      results.tests[1].status = "success";
      results.tests[1].result = testResult;

      // Test 3: Check status of the test message
      const messageId = typeof testResult.data === "object" && testResult.data && "message_id" in testResult.data
        ? String((testResult.data as Record<string, unknown>)["message_id"] ?? "")
        : "";
      if (messageId) {
        results.tests.push({
          name: "Check test message status",
          messageId,
          status: "running"
        });

        // Wait a bit before checking status
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
          const testStatus = await getMessageStatus(messageId);
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

  } catch (error) {
    results.error = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(results);
}
