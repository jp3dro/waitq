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
          .insert({ owner_user_id: user.id, name: defaultName, accent_color: "#FFFFFF", background_color: "#000000" });

        // Ensure owner is admin member
        const { data: biz } = await admin
          .from("businesses")
          .select("id")
          .eq("owner_user_id", user.id)
          .maybeSingle();
        if (biz?.id) {
          await admin
            .from("memberships")
            .insert({ business_id: biz.id as string, user_id: user.id, role: 'admin' })
            .select("id")
            .maybeSingle();
        }
      }
    }
  }
  const redirectUrl = new URL("/dashboard", process.env.NEXT_PUBLIC_SITE_URL || req.url);
  return NextResponse.redirect(redirectUrl);
}


