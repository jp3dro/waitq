import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createRouteClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Ensure a business exists for this user; if not, create one
      const admin = getAdminClient();
      const { data: existing } = await admin
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (!existing) {
        const defaultName = (user.email || "My Business").split("@")[0];
        await admin
          .from("businesses")
          .insert({ owner_user_id: user.id, name: defaultName });
      }
    }
  }
  // Redirect back to the same origin that initiated the login (dev → localhost, prod → waitq.app)
  const origin = new URL(req.url).origin;
  const redirectUrl = new URL("/dashboard", origin);
  return NextResponse.redirect(redirectUrl);
}


