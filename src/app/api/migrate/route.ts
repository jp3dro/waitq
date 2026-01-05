import { NextResponse } from "next/server";

// Intentionally disabled in production builds.
// Database migrations must be applied via Supabase migrations / CI tooling, not via a public HTTP endpoint.
export async function POST() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}
