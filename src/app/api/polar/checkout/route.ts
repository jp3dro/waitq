import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
 
export const runtime = "nodejs";
 
function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
 
function planToProductId(planId: string) {
  switch (planId) {
    case "free":
      return process.env.PRODUCT_ID_FREE || null;
    case "base":
      return process.env.PRODUCT_ID_BASE || null;
    case "premium":
      return process.env.PRODUCT_ID_PREMIUM || null;
    default:
      return null;
  }
}
 
async function resolveBusinessIdForUser(supabase: Awaited<ReturnType<typeof createRouteClient>>, userId: string) {
  try {
    const { data: owned } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (owned?.id) return owned.id as string;
 
    const { data: memberOf } = await supabase
      .from("memberships")
      .select("business_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return (memberOf?.business_id as string | undefined) || null;
  } catch {
    return null;
  }
}
 
/**
 * Wrapper route that:
 * - resolves the signed-in Supabase user
 * - maps `planId` -> Polar `products`
 * - attaches `customerExternalId` + `metadata` (so webhooks can reconcile to existing DB rows)
   * - redirects to `/api/polar/hosted-checkout` (the actual Polar adapter handler)
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const planId = sp.get("planId") || "";
  const successPath = sp.get("successPath") || null;
  const cancelPath = sp.get("cancelPath") || null;
 
  if (!planId) {
    return NextResponse.json({ error: "Missing planId" }, { status: 400 });
  }
 
  // Free plan: no checkout needed.
  if (planId === "free") {
    return NextResponse.redirect(new URL("/lists", siteUrl()));
  }
 
  const productId = planToProductId(planId);
  if (!productId) {
    return NextResponse.json({ error: "Missing Polar product id for plan" }, { status: 500 });
  }
 
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 
  const businessId = await resolveBusinessIdForUser(supabase, user.id);
 
  // IMPORTANT: Polar validates metadata values; empty strings can fail validation.
  // Only include keys when we have a meaningful value.
  const metadata: Record<string, string> = {
    user_id: user.id,
    plan_id: planId,
    billing_provider: "polar",
  };
  if (businessId) metadata.business_id = businessId;
  if (successPath && successPath.trim().length > 0) metadata.success_path = successPath;
  if (cancelPath && cancelPath.trim().length > 0) metadata.cancel_path = cancelPath;
 
  const checkoutUrl = new URL("/api/polar/hosted-checkout", siteUrl());
  checkoutUrl.searchParams.set("products", productId);
  checkoutUrl.searchParams.set("customerExternalId", user.id);
  if (user.email) checkoutUrl.searchParams.set("customerEmail", user.email);
  const name =
    typeof (user.user_metadata as any)?.full_name === "string" ? ((user.user_metadata as any).full_name as string) : "";
  if (name) checkoutUrl.searchParams.set("customerName", name);
  // Polar expects a URL-encoded JSON string; URLSearchParams will handle encoding.
  checkoutUrl.searchParams.set("metadata", JSON.stringify(metadata));
 
  return NextResponse.redirect(checkoutUrl, { status: 302 });
}

