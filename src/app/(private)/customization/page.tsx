export const metadata = { title: "Customization" };

export default async function CustomizationPage() {
  // Preload customization to avoid client-side flicker
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let initial: { accent_color: string | null; background_color: string | null; cover_url: string | null } | null = null;
  if (user) {
    const { getAdminClient } = await import("@/lib/supabase/admin");
    const admin = getAdminClient();
    const { data } = await admin
      .from("businesses")
      .select("accent_color, background_color, cover_url")
      .eq("owner_user_id", user.id)
      .maybeSingle();
    initial = (data as typeof initial) || null;
  }

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customization</h1>
          </div>
        </div>

        <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
          <ClientWrapper initial={initial} />
        </div>
      </div>
    </main>
  );
}


// Small server wrapper to import the client component lazily
async function ClientWrapper({ initial }: { initial: { accent_color: string | null; background_color: string | null; cover_url: string | null } | null }) {
  const { default: CustomizationClient } = await import("./CustomizationClient");
  return <CustomizationClient initial={initial || undefined} />;
}


