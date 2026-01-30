import type { Metadata } from "next";
import DisplayClient from "./status-client";
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
    title: titleParts ? `${titleParts} — Queue Display` : "Queue Display",
    description: "Live waitlist display showing current queue status and wait times.",
    robots: { index: false, follow: false },
  };
}

export default async function DisplayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <DisplayClient token={token} />;
}


