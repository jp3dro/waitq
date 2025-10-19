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
            <p className="mt-1 text-sm text-neutral-600">Manage your account and business settings</p>
          </div>
        </div>

        <div className="bg-white ring-1 ring-black/5 rounded-xl p-6">
          <ToastOnQuery />
          <div className="grid gap-3 text-sm">
        <div>
          <div className="text-neutral-600">Email</div>
          <div className="font-medium">{user?.email}</div>
        </div>
        <div>
          <div className="text-neutral-600">User ID</div>
          <div className="font-mono text-xs">{user?.id}</div>
        </div>
        <SaveBusinessForm
          initialName={(business as Business)?.name || ""}
          initialCountry={(business as Business)?.country_code || "PT"}
        />
        <div className="grid md:grid-cols-[96px_1fr] items-start gap-4 mt-6">
          <div className="h-24 w-24 rounded-md ring-1 ring-neutral-200 overflow-hidden bg-neutral-50 flex items-center justify-center">
            {business?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logo_url || ""} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-neutral-500">No logo</span>
            )}
          </div>
          <div>
            <UploadLogo />
            <div className="mt-2 text-xs text-neutral-600">PNG/JPG, square recommended. Max 5 MB.</div>
          </div>
        </div>
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
        <label className="text-sm font-medium text-neutral-700" htmlFor="name">Business name</label>
        <input
          id="name"
          name="name"
          defaultValue={initialName}
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9500]"
          placeholder="e.g., Acme Barbers"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-neutral-700" htmlFor="country">Business country</label>
        <select
          id="country"
          name="country"
          defaultValue={initialCountry || "PT"}
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9500]"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        <div className="mt-1 text-xs text-neutral-600">Used to set the default phone prefix in kiosk.</div>
      </div>
      <div className="pt-2">
        <button className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800">Save changes</button>
      </div>
    </form>
  );
}

function UploadLogo() {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        const file = formData.get("file") as File | null;
        if (!file) redirect("/profile?err=No%20file%20selected");
        if (file.size > 5 * 1024 * 1024) redirect("/profile?err=File%20too%20large%20(max%205MB)");

        const supa = await createRouteClient();
        const admin = getAdminClient();
        const { data: biz } = await supa
          .from("businesses")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();
        if (!biz?.id) redirect("/profile?err=No%20business%20found");

        const contentType = file.type || "application/octet-stream";
        if (!contentType.startsWith("image/")) redirect("/profile?err=Unsupported%20file%20type");

        const bytes = await file.arrayBuffer();
        const buffer = new Uint8Array(bytes);
        const fileExt = (file.name.split(".").pop() || "png").toLowerCase();
        const objectPath = `${biz.id}/${Date.now()}.${fileExt}`;

        const { data: up, error: upErr } = await admin.storage.from("logos").upload(objectPath, buffer, { contentType, upsert: false });
        if (upErr || !up) redirect(`/profile?err=${encodeURIComponent(upErr?.message || "Upload failed")}`);
        const { data: pub } = admin.storage.from("logos").getPublicUrl(up.path);
        const { error: updErr } = await supa.from("businesses").update({ logo_url: pub.publicUrl }).eq("id", biz.id);
        if (updErr) redirect(`/profile?err=${encodeURIComponent(updErr.message)}`);

        revalidatePath("/profile");
        redirect("/profile?ok=1");
      }}
      className="flex items-center gap-2"
    >
      <input
        type="file"
        name="file"
        accept="image/*"
        className="block w-full max-w-sm text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
      />
      <button className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50">Upload</button>
    </form>
  );
}


