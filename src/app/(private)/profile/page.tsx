import { createClient, createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ToastOnQuery from "@/components/toast-on-query";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  type Business = { id: string; name: string | null; logo_url: string | null; country_code: string | null } | null;
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, logo_url, country_code")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          </div>
        </div>

        <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
          <ToastOnQuery />
          <div className="grid gap-3 text-sm">
        <div>
          <div className="text-muted-foreground">Email</div>
          <div className="font-medium">{user?.email}</div>
        </div>
        <div>
          <div className="text-muted-foreground">User ID</div>
          <div className="font-mono text-xs">{user?.id}</div>
        </div>
        <SaveBusinessForm
          initialName={(business as Business)?.name || ""}
          initialCountry={(business as Business)?.country_code || "PT"}
        />
        {/* Brand logo moved to Customization page */}
        </div>
        </div>
      </div>
    </main>
  );
}

// ToastOnQuery moved to a dedicated client component

function SaveBusinessForm({ initialName, initialCountry }: { initialName: string; initialCountry: string }) {
  async function action(formData: FormData) {
    "use server";
    const updates: { name?: string; country_code?: string } = {};

    // Handle business name
    const nameRaw = (formData.get("name") as string) || "";
    const name = nameRaw.trim();
    if (name.length > 0) {
      updates.name = name;
    }

    // Handle country code
    const code = ((formData.get("country") as string) || "PT").trim().toUpperCase();
    const allowed = ["PT","US","GB","ES","FR","DE","BR","CA","AU","IN","IT","NL","SE","NO","DK","IE","FI","MX","AR","CL","CO"];
    const final = allowed.includes(code) ? code : "PT";
    updates.country_code = final;

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      const supa = await createRouteClient();
      const { data: biz } = await supa
        .from("businesses")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
      if (biz?.id) {
        await supa.from("businesses").update(updates).eq("id", biz.id);
      }
    }

    revalidatePath("/profile");
    redirect("/profile?ok=1");
  }

  const countries: { code: string; name: string }[] = [
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "PT", name: "Portugal" },
    { code: "ES", name: "Spain" },
    { code: "FR", name: "France" },
    { code: "DE", name: "Germany" },
    { code: "BR", name: "Brazil" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "IN", name: "India" },
    { code: "IT", name: "Italy" },
    { code: "NL", name: "Netherlands" },
    { code: "SE", name: "Sweden" },
    { code: "NO", name: "Norway" },
    { code: "DK", name: "Denmark" },
    { code: "IE", name: "Ireland" },
    { code: "FI", name: "Finland" },
    { code: "MX", name: "Mexico" },
    { code: "AR", name: "Argentina" },
    { code: "CL", name: "Chile" },
    { code: "CO", name: "Colombia" },
  ];

  return (
    <form action={action} className="mt-4 grid gap-4">
      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="name">Business name</label>
        <input
          id="name"
          name="name"
          defaultValue={initialName}
          className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="e.g., Acme Barbers"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="country">Business country</label>
        <select
          id="country"
          name="country"
          defaultValue={initialCountry || "PT"}
          className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        <div className="mt-1 text-xs text-muted-foreground">Used to set the default phone prefix in kiosk.</div>
      </div>
      <div className="pt-2">
        <button className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90">Save changes</button>
      </div>
    </form>
  );
}

// UploadLogo moved to Customization page


