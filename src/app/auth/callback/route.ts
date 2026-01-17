import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : null;

  if (code || tokenHash) {
    const supabase = await createRouteClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({
          type: (type as any) || "recovery",
          token_hash: tokenHash as string,
        });

    if (!error) {
      // Allow certain flows to bypass onboarding redirect logic (ex: password recovery)
      if (safeNext === "/reset-password") {
        return NextResponse.redirect(new URL(safeNext, process.env.NEXT_PUBLIC_SITE_URL || req.url));
      }

      // Check onboarding status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        // If profile doesn't exist (e.g. created before trigger), create it now
        if (!profile) {
          await supabase.from('profiles').insert({ id: user.id });
          return NextResponse.redirect(new URL("/onboarding", process.env.NEXT_PUBLIC_SITE_URL || req.url));
        }

        if (!profile.onboarding_completed) {
          return NextResponse.redirect(new URL("/onboarding", process.env.NEXT_PUBLIC_SITE_URL || req.url));
        }
      }
    }
  }

  // Default to dashboard if everything is fine (or if code is missing/error)
  // Ideally, if error, we might want to redirect to login with error, but standard is dashboard/home
  return NextResponse.redirect(
    new URL(safeNext || "/dashboard", process.env.NEXT_PUBLIC_SITE_URL || req.url)
  );
}



