import { CustomerPortal } from "@polar-sh/nextjs";
import type { NextRequest } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function resolveServerEnv() {
  const raw = (process.env.POLAR_SERVER || "").toLowerCase().trim();
  if (raw === "production") return "production" as const;
  // Default to sandbox for local migration testing.
  return "sandbox" as const;
}

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: resolveServerEnv(),
  returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/subscriptions`,
  getCustomerId: async (req: NextRequest) => {
    // Cache Polar customer id in `subscriptions.polar_customer_id` when possible.
    try {
      const supabase = await createRouteClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return "";

      const { data: row } = await supabase
        .from("subscriptions")
        .select("polar_customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const existing = (row?.polar_customer_id as string | null) || "";
      if (existing) return existing;

      // API-only mode: if DB doesn't have the Polar customer id yet, fetch it from Polar by external id.
      const token = process.env.POLAR_ACCESS_TOKEN;
      if (!token) return "";
      const base = (process.env.POLAR_SERVER || "").toLowerCase().trim() === "production"
        ? "https://api.polar.sh"
        : "https://sandbox-api.polar.sh";
      const res = await fetch(`${base}/v1/customers/external/${encodeURIComponent(user.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) return "";
      const json = (await res.json()) as { id?: string };
      return typeof json.id === "string" ? json.id : "";
    } catch {
      return "";
    }
  },
});

