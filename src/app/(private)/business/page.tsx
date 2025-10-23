"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ToastOnQuery from "@/components/toast-on-query";
import Dropdown from "@/components/dropdown";
import { toastManager } from "@/hooks/use-toast";

export default function BusinessPage() {
  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Business</h1>
          </div>
        </div>

        <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
          <ToastOnQuery />
          <div className="grid gap-3 text-sm">
            <UserInfo />
            <SaveBusinessForm />
            {/* Brand logo moved to Customization page */}
          </div>
        </div>
      </div>
    </main>
  );
}

function UserInfo() {
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ email: user.email || "", id: user.id });
      }
    };
    fetchUser();
  }, []);

  if (!user) return null;

  return (
    <>
      <div>
        <div className="text-muted-foreground">Email</div>
        <div className="font-medium">{user.email}</div>
      </div>
      <div>
        <div className="text-muted-foreground">User ID</div>
        <div className="font-mono text-xs">{user.id}</div>
      </div>
    </>
  );
}

function SaveBusinessForm() {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("PT");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      const supabase = createClient();
      const { data: business } = await supabase
        .from("businesses")
        .select("name, country_code")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (business) {
        setName(business.name || "");
        setCountry(business.country_code || "PT");
      }
    };
    fetchBusiness();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updates: { name?: string; country_code?: string } = {};

      const trimmedName = name.trim();
      if (trimmedName.length > 0) {
        updates.name = trimmedName;
      }

      const allowed = ["PT","US","GB","ES","FR","DE","BR","CA","AU","IN","IT","NL","SE","NO","DK","IE","FI","MX","AR","CL","CO"];
      const finalCountry = allowed.includes(country) ? country : "PT";
      updates.country_code = finalCountry;

      if (Object.keys(updates).length > 0) {
        const supabase = createClient();
        const { data: biz } = await supabase
          .from("businesses")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (biz?.id) {
          await supabase.from("businesses").update(updates).eq("id", biz.id);
        }
      }

      // Show success toast
      toastManager.add({
        title: "Success",
        description: "Business settings saved successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to save business:", error);
      toastManager.add({
        title: "Failed to save",
        description: "Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const countries: { value: string; label: string }[] = [
    { value: "US", label: "United States" },
    { value: "GB", label: "United Kingdom" },
    { value: "PT", label: "Portugal" },
    { value: "ES", label: "Spain" },
    { value: "FR", label: "France" },
    { value: "DE", label: "Germany" },
    { value: "BR", label: "Brazil" },
    { value: "CA", label: "Canada" },
    { value: "AU", label: "Australia" },
    { value: "IN", label: "India" },
    { value: "IT", label: "Italy" },
    { value: "NL", label: "Netherlands" },
    { value: "SE", label: "Sweden" },
    { value: "NO", label: "Norway" },
    { value: "DK", label: "Denmark" },
    { value: "IE", label: "Ireland" },
    { value: "FI", label: "Finland" },
    { value: "MX", label: "Mexico" },
    { value: "AR", label: "Argentina" },
    { value: "CL", label: "Chile" },
    { value: "CO", label: "Colombia" },
  ];

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="name">Business name</label>
        <input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="e.g., Acme Barbers"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Business country</label>
        <div className="mt-1">
          <Dropdown
            value={country}
            onChange={setCountry}
            options={countries}
            placeholder="Select a country"
          />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">Used to set the default phone prefix in kiosk.</div>
      </div>
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="action-btn action-btn--primary disabled:opacity-50"
        >
          {isLoading ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// legacy re-exports removed


