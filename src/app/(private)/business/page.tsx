import { createClient } from "@/lib/supabase/server";
import BusinessDetailsClient from "./BusinessDetailsClient";

export const metadata = { title: "Business" };

export default async function BusinessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // PrivateLayout already guards auth, but keep it defensive for direct access.
  if (!user) {
    return null;
  }

  // Resolve the “current” business similarly to the rest of the private app:
  // prefer owned business, else first membership, else first business (legacy single-tenant behavior).
  let businessId: string | null = null;
  let canEdit = false;

  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  businessId = (owned?.id as string | undefined) ?? null;
  if (businessId) canEdit = true;

  if (!businessId) {
    const { data: member } = await supabase
      .from("memberships")
      .select("business_id, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    businessId = (member?.business_id as string | undefined) ?? null;
    canEdit = (member?.role as string | undefined) === "admin";
  }

  const { data: biz } = businessId
    ? await supabase
        .from("businesses")
        .select(
          "id, name, logo_url, cover_url, accent_color, background_color, country_code, time_format, owner_user_id, created_at, website_url, instagram_url, facebook_url, google_maps_url, menu_url"
        )
        .eq("id", businessId)
        .maybeSingle()
    : await supabase
        .from("businesses")
        .select(
          "id, name, logo_url, cover_url, accent_color, background_color, country_code, time_format, owner_user_id, created_at, website_url, instagram_url, facebook_url, google_maps_url, menu_url"
        )
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

  const business = (biz || null) as {
    id: string;
    name: string | null;
    logo_url: string | null;
    cover_url: string | null;
    accent_color: string | null;
    background_color: string | null;
    country_code: string | null;
    time_format?: string | null;
    owner_user_id: string | null;
    created_at: string;
    website_url?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    google_maps_url?: string | null;
    menu_url?: string | null;
  } | null;

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Business</h1>
          </div>
        </div>

        {business ? (
          <BusinessDetailsClient initial={business} canEdit={canEdit} />
        ) : (
          <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
            <div className="space-y-2">
              <div className="font-medium">No business found</div>
              <div className="text-sm text-muted-foreground">Create a business to manage settings.</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


