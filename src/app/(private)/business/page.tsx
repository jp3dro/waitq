import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  businessId = (owned?.id as string | undefined) ?? null;

  if (!businessId) {
    const { data: member } = await supabase
      .from("memberships")
      .select("business_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    businessId = (member?.business_id as string | undefined) ?? null;
  }

  const { data: biz } = businessId
    ? await supabase
        .from("businesses")
        .select("id, name, logo_url, created_at")
        .eq("id", businessId)
        .maybeSingle()
    : await supabase
        .from("businesses")
        .select("id, name, logo_url, created_at")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

  const business = (biz || null) as {
    id: string;
    name: string | null;
    logo_url: string | null;
    created_at: string;
  } | null;

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Business</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your business settings.</p>
          </div>
        </div>

        <Card className="p-6">
          {business ? (
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="text-lg font-semibold">{business.name || "Unnamed business"}</div>
                <div className="text-xs text-muted-foreground">
                  Created {new Date(business.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline">
                  <Link href="/locations">Locations</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/customization">Customization</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/users">Users</Link>
                </Button>
                <Button asChild>
                  <Link href="/subscriptions">Subscription</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="font-medium">No business found</div>
              <div className="text-sm text-muted-foreground">
                Create a business to manage settings.
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}


