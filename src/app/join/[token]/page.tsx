import type { Metadata } from "next";
import JoinPage from "./join-client";
import { getAdminClient } from "@/lib/supabase/admin";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const admin = getAdminClient();
  const { data: wl } = await admin
    .from("waitlists")
    .select("name, business_id")
    .eq("display_token", token)
    .maybeSingle();

  const listName = (wl?.name as string | null) || null;
  const businessId = (wl?.business_id as string | null) || null;
  let businessName: string | null = null;
  if (businessId) {
    const { data: biz } = await admin.from("businesses").select("name").eq("id", businessId).maybeSingle();
    businessName = (biz?.name as string | null) || null;
  }

  const titleParts = [businessName, listName].filter(Boolean).join(" • ");
  return {
    title: titleParts ? `Join ${titleParts}` : "Join Waitlist",
    description: "Join the waitlist and get notified when your table is ready.",
    robots: { index: false, follow: false },
  };
}

export default function Page({ params }: { params: Promise<{ token: string }> }) {
  return <JoinPage params={params} />;
}
