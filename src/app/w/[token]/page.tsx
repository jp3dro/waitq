import type { Metadata } from "next";
import ClientStatus from "@/app/w/[token]/status-client";
import { getAdminClient } from "@/lib/supabase/admin";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const admin = getAdminClient();

  const { data: entry } = await admin
    .from("waitlist_entries")
    .select("business_id, waitlist_id")
    .eq("token", token)
    .maybeSingle();

  const businessId = (entry?.business_id as string | null) || null;
  const waitlistId = (entry?.waitlist_id as string | null) || null;
  let businessName: string | null = null;
  let listName: string | null = null;

  if (businessId) {
    const { data: biz } = await admin.from("businesses").select("name").eq("id", businessId).maybeSingle();
    businessName = (biz?.name as string | null) || null;
  }
  if (waitlistId) {
    const { data: wl } = await admin.from("waitlists").select("name").eq("id", waitlistId).maybeSingle();
    listName = (wl?.name as string | null) || null;
  }

  const titleParts = [businessName, listName].filter(Boolean).join(" • ");
  return {
    title: titleParts ? `${titleParts} — Status` : "Your Waitlist Status",
    description: "Check your position in the waitlist and estimated wait time.",
    robots: { index: false, follow: false },
  };
}

export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div>
      <ClientStatus token={token} />
    </div>
  );
}


