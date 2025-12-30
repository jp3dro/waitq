"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Customization = {
  id: string;
  accent_color: string | null;
  background_color: string | null;
  logo_url: string | null;
};

export default function CustomizationClient({ initial }: { initial?: { accent_color: string | null; background_color: string | null; logo_url?: string | null } }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Background color controls removed from internal UI per brand-scoping change

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const logoFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Hydrate from server-provided initial to avoid flicker
    if (initial) {
      setLogoUrl(initial.logo_url || null);
    }
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/customization", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load customization");
        const json: { customization: Customization | null } = await res.json();
        if (!active) return;
        if (json?.customization) {
          setLogoUrl(json.customization.logo_url || null);
        } else {
          // noop
        }
      } catch (e) {
        // noop toast-on-query pattern elsewhere
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function saveCustomization() {
    setSaving(true);
    try {
      const res = await fetch("/api/customization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // No fields to save currently as logo is handled via separate upload endpoint
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large (max 5MB)");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await fetch("/api/customization/logo", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Upload failed");
      setLogoUrl(j.url || null);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Brand logo */}
      <section>
        <div className="text-sm font-medium">Brand logo</div>
        <div className="mt-2 grid md:grid-cols-[96px_1fr] items-start gap-4">
          <div className="h-24 w-24 rounded-md ring-1 ring-border overflow-hidden bg-muted flex items-center justify-center">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground">No logo</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={logoFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleLogoUpload(f);
              }}
            />
            <button
              type="button"
              onClick={() => logoFileRef.current?.click()}
              disabled={uploading}
              className="text-sm px-3 h-8 rounded-md border border-border bg-card hover:bg-muted disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload logo"}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/customization/logo", { method: "DELETE" });
                  if (res.ok) setLogoUrl(null);
                }}
                className="text-sm px-3 h-8 rounded-md border border-border"
              >
                Remove
              </button>
            )}
            <div className="text-xs text-muted-foreground">PNG/JPG, square recommended. Max 5 MB.</div>
          </div>
        </div>
      </section>

      <div className="pt-2">
        <Button type="button" onClick={() => void saveCustomization()} disabled={loading || saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}


