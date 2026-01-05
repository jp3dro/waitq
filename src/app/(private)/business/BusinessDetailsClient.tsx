"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { getCountries } from "react-phone-number-input";
import { useRouter } from "next/navigation";
import { toastManager } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Business = {
  id: string;
  name: string | null;
  logo_url: string | null;
  accent_color: string | null;
  background_color: string | null;
  country_code: string | null;
  owner_user_id: string | null;
  created_at: string;
};

type Props = {
  initial: Business;
  canEdit: boolean;
};

type Baseline = {
  name: string;
  country_code: string;
};

function toBaseline(biz: Business): Baseline {
  return {
    name: (biz.name || "").trim(),
    country_code: (biz.country_code || "PT").trim().toUpperCase(),
  };
}

export default function BusinessDetailsClient({ initial, canEdit }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const logoFileRef = useRef<HTMLInputElement | null>(null);

  const [baseline, setBaseline] = useState<Baseline>(() => toBaseline(initial));

  const [name, setName] = useState(baseline.name);
  const [countryCode, setCountryCode] = useState(baseline.country_code);
  const [logoUrl, setLogoUrl] = useState(initial.logo_url || "");

  const dirty = useMemo(() => {
    const next: Baseline = {
      name: name.trim(),
      country_code: countryCode.trim().toUpperCase(),
    };
    return JSON.stringify(next) !== JSON.stringify(baseline);
  }, [baseline, countryCode, name]);

  const countryOptions = useMemo(() => {
    const codes = getCountries();
    const displayNames =
      typeof Intl !== "undefined" && "DisplayNames" in Intl
        ? new Intl.DisplayNames(undefined, { type: "region" })
        : null;
    return codes
      .map((code) => ({
        code,
        name: displayNames?.of(code) || code,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const selectedCountryLabel = useMemo(() => {
    const displayNames =
      typeof Intl !== "undefined" && "DisplayNames" in Intl
        ? new Intl.DisplayNames(undefined, { type: "region" })
        : null;
    return displayNames?.of(countryCode) || countryCode;
  }, [countryCode]);

  async function uploadLogo(file: File) {
    if (!canEdit) return;
    if (file.size > 5 * 1024 * 1024) {
      toastManager.add({ title: "Upload failed", description: "File too large (max 5MB).", type: "error" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toastManager.add({ title: "Upload failed", description: "File must be an image.", type: "error" });
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await fetch("/api/customization/logo", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Upload failed");

      const url = typeof j?.url === "string" ? j.url : null;
      if (!url) throw new Error("Upload failed");

      setLogoUrl(url);
      router.refresh(); // ensure server components (sidebar) pick up new logo_url immediately
      toastManager.add({ title: "Uploaded", description: "Logo updated.", type: "success" });
    } catch (e) {
      toastManager.add({ title: "Upload failed", description: (e as Error).message, type: "error" });
    } finally {
      setUploading(false);
    }
  }

  async function removeLogo() {
    if (!canEdit) return;
    setUploading(true);
    try {
      const res = await fetch("/api/customization/logo", { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Failed to remove logo");

      setLogoUrl("");
      router.refresh(); // ensure server components (sidebar) pick up logo removal immediately
      toastManager.add({ title: "Removed", description: "Logo removed.", type: "success" });
    } catch (e) {
      toastManager.add({ title: "Error", description: (e as Error).message, type: "error" });
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!canEdit) return;
    startTransition(async () => {
      const payload: Record<string, unknown> = {};

      const n = name.trim();
      if (n !== baseline.name) payload.name = n;

      const cc = countryCode.trim().toUpperCase();
      if (cc !== baseline.country_code) payload.countryCode = cc;

      if (Object.keys(payload).length === 0) {
        toastManager.add({ title: "No changes", description: "Nothing to save.", type: "info" });
        return;
      }

      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        toastManager.add({ title: "Saved", description: "Business details updated.", type: "success" });
        if (j?.business) {
          const nextBaseline = toBaseline(j.business as Business);
          setBaseline(nextBaseline);
          setName(nextBaseline.name);
          setCountryCode(nextBaseline.country_code);
        }
      } else {
        const err = typeof j?.error === "string" ? j.error : "Failed to save changes";
        toastManager.add({ title: "Error", description: err, type: "error" });
      }
    });
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              placeholder="Your business name"
            />
            <p className="text-sm text-muted-foreground">This name appears on your public waitlist pages and QR code.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Country
            </label>
            <Select value={countryCode} onValueChange={(v) => setCountryCode(v)} disabled={!canEdit}>
              <SelectTrigger>
                <SelectValue placeholder="Select a country">
                  {selectedCountryLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Used as the default region for phone number formatting.</p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="text-sm font-medium">Brand logo</div>
            <div className="grid items-start gap-4 md:grid-cols-[96px_1fr]">
              <div className="h-24 w-24 rounded-md ring-1 ring-border overflow-hidden bg-muted flex items-center justify-center">
                {logoUrl.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl.trim()} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">No logo</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadLogo(f);
                    if (logoFileRef.current) logoFileRef.current.value = "";
                  }}
                />
                <Button type="button" variant="outline" onClick={() => logoFileRef.current?.click()} disabled={!canEdit || uploading}>
                  {uploading ? "Uploading..." : "Upload logo"}
                </Button>
                {logoUrl.trim() ? (
                  <Button type="button" variant="outline" onClick={() => void removeLogo()} disabled={!canEdit || uploading}>
                    Remove
                  </Button>
                ) : null}
                <div className="text-xs text-muted-foreground">PNG/JPG, square recommended. Max 5 MB.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Save button (bottom-left of content area) */}
      <div
        className={[
          "fixed bottom-6 left-6 z-40",
          "md:left-[calc(var(--sidebar-width)+1.5rem)]",
          "md:group-data-[collapsible=icon]/sidebar-wrapper:left-[calc(var(--sidebar-width-icon)+1.5rem)]",
        ].join(" ")}
      >
        <Button onClick={save} disabled={!canEdit || isPending || uploading || !dirty}>
          {isPending ? "Saving..." : "Save changes"}
        </Button>
        {!canEdit ? (
          <div className="mt-2 text-xs text-muted-foreground">You don’t have permission to edit this business.</div>
        ) : null}
      </div>
    </div>
  );
}


