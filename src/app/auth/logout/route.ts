import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createRouteClient();
  await supabase.auth.signOut();
  const url = new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET() {
  // Support link-based logout (more reliable in menus).
  return POST();
}


