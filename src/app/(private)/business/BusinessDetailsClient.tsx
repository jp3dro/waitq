"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { getCountries } from "react-phone-number-input";
import { useRouter } from "next/navigation";
import { toastManager } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isEuCountry } from "@/lib/eu";
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
  time_format?: string | null;
  vat_id?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  google_maps_url?: string | null;
  menu_url?: string | null;
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
  time_format: "24h" | "12h";
  vat_id: string;
  website_url: string;
  instagram_url: string;
  facebook_url: string;
  google_maps_url: string;
  menu_url: string;
};

function toBaseline(biz: Business): Baseline {
  return {
    name: (biz.name || "").trim(),
    country_code: (biz.country_code || "PT").trim().toUpperCase(),
    time_format: biz.time_format === "12h" ? "12h" : "24h",
    vat_id: ((biz.vat_id as string | null) || "").trim().toUpperCase(),
    website_url: (biz.website_url || "").trim(),
    instagram_url: (biz.instagram_url || "").trim(),
    facebook_url: (biz.facebook_url || "").trim(),
    google_maps_url: (biz.google_maps_url || "").trim(),
    menu_url: (biz.menu_url || "").trim(),
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
  const [timeFormat, setTimeFormat] = useState<"24h" | "12h">(baseline.time_format);
  const [vatId, setVatId] = useState(baseline.vat_id);
  const [vatStatus, setVatStatus] = useState<null | { state: "idle" | "checking" | "valid" | "invalid" | "error"; detail?: string }>(
    null
  );
  const [logoUrl, setLogoUrl] = useState(initial.logo_url || "");
  const [websiteUrl, setWebsiteUrl] = useState(baseline.website_url);
  const [instagramUrl, setInstagramUrl] = useState(baseline.instagram_url);
  const [facebookUrl, setFacebookUrl] = useState(baseline.facebook_url);
  const [googleMapsUrl, setGoogleMapsUrl] = useState(baseline.google_maps_url);
  const [menuUrl, setMenuUrl] = useState(baseline.menu_url);

  const dirty = useMemo(() => {
    const next: Baseline = {
      name: name.trim(),
      country_code: countryCode.trim().toUpperCase(),
      time_format: timeFormat,
      vat_id: vatId.trim().toUpperCase(),
      website_url: websiteUrl.trim(),
      instagram_url: instagramUrl.trim(),
      facebook_url: facebookUrl.trim(),
      google_maps_url: googleMapsUrl.trim(),
      menu_url: menuUrl.trim(),
    };
    return JSON.stringify(next) !== JSON.stringify(baseline);
  }, [baseline, countryCode, facebookUrl, googleMapsUrl, instagramUrl, menuUrl, name, timeFormat, vatId, websiteUrl]);

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

  async function validateVatNow() {
    const cc = countryCode.trim().toUpperCase();
    const v = vatId.trim().toUpperCase();
    if (!isEuCountry(cc)) {
      setVatStatus({ state: "error", detail: "VAT validation is only available for EU countries." });
      return;
    }
    if (!v) {
      setVatStatus({ state: "error", detail: "Enter a VAT ID to validate." });
      return;
    }
    setVatStatus({ state: "checking" });
    try {
      const res = await fetch("/api/vat/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: cc, vatId: v }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        valid?: boolean | null;
        reason?: string;
        name?: string | null;
        address?: string | null;
      };

      const nowIso = new Date().toISOString();
      const persistValidation = async (valid: boolean) => {
        try {
          // Best-effort: persist VAT ID and validation result for billing/records.
          // If the DB schema doesn't include these columns, the API gracefully retries without them.
          await fetch("/api/business", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vatId: v,
              vatIdValid: valid,
              vatIdValidatedAt: nowIso,
              vatIdName: j?.name ?? null,
              vatIdAddress: j?.address ?? null,
            }),
          });
        } catch {
          // ignore (best-effort persistence)
        }
      };

      if (res.ok && j?.valid === true) {
        setVatStatus({ state: "valid" });
        void persistValidation(true);
      } else if (res.ok && j?.valid === false) {
        setVatStatus({ state: "invalid", detail: typeof j?.reason === "string" ? j.reason : undefined });
        void persistValidation(false);
      } else {
        setVatStatus({ state: "error", detail: typeof j?.reason === "string" ? j.reason : "Unable to validate VAT ID" });
      }
    } catch (e) {
      setVatStatus({ state: "error", detail: (e as Error).message });
    }
  }

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
      const normalizeUrl = (v: string) => {
        const t = v.trim();
        if (!t) return "";
        // Allow absolute urls; if scheme is missing, default to https://
        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(t)) return t;
        return `https://${t}`;
      };

      const payload: Record<string, unknown> = {};

      const n = name.trim();
      if (n !== baseline.name) payload.name = n;

      const cc = countryCode.trim().toUpperCase();
      if (cc !== baseline.country_code) payload.countryCode = cc;

      if (timeFormat !== baseline.time_format) payload.timeFormat = timeFormat;

      const v = vatId.trim().toUpperCase();
      if (v !== baseline.vat_id) payload.vatId = v || null;

      const w = normalizeUrl(websiteUrl);
      if (w !== baseline.website_url) payload.websiteUrl = w || null;

      const ig = normalizeUrl(instagramUrl);
      if (ig !== baseline.instagram_url) payload.instagramUrl = ig || null;

      const fb = normalizeUrl(facebookUrl);
      if (fb !== baseline.facebook_url) payload.facebookUrl = fb || null;

      const gm = normalizeUrl(googleMapsUrl);
      if (gm !== baseline.google_maps_url) payload.googleMapsUrl = gm || null;

      const mu = normalizeUrl(menuUrl);
      if (mu !== baseline.menu_url) payload.menuUrl = mu || null;

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
          setTimeFormat(nextBaseline.time_format);
          setVatId(nextBaseline.vat_id);
          setWebsiteUrl(nextBaseline.website_url);
          setInstagramUrl(nextBaseline.instagram_url);
          setFacebookUrl(nextBaseline.facebook_url);
          setGoogleMapsUrl(nextBaseline.google_maps_url);
          setMenuUrl(nextBaseline.menu_url);
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

          <div className="space-y-4 pt-1">
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

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Time format
            </label>
            <Select value={timeFormat} onValueChange={(v) => setTimeFormat(v as "24h" | "12h")} disabled={!canEdit}>
              <SelectTrigger>
                <SelectValue placeholder="Select time format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24-hour (e.g. 18:30)</SelectItem>
                <SelectItem value="12h">12-hour (e.g. 6:30 PM)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Controls how times are displayed and edited across WaitQ.</p>
          </div>

          {isEuCountry(countryCode) ? (
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                VAT ID
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={vatId}
                  onChange={(e) => {
                    setVatId(e.target.value);
                    setVatStatus(null);
                  }}
                  disabled={!canEdit}
                  placeholder="e.g. PT123456789"
                  autoCapitalize="characters"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void validateVatNow()}
                  disabled={!canEdit || vatStatus?.state === "checking"}
                >
                  {vatStatus?.state === "checking" ? "Validating..." : "Validate"}
                </Button>
              </div>
              <div className="text-sm">
                {vatStatus?.state === "checking" ? (
                  <span className="text-muted-foreground">Checking VAT ID…</span>
                ) : vatStatus?.state === "valid" ? (
                  <span className="text-emerald-600">VAT ID is valid (VIES)</span>
                ) : vatStatus?.state === "invalid" ? (
                  <span className="text-destructive">VAT ID is not valid{vatStatus.detail ? `: ${vatStatus.detail}` : ""}</span>
                ) : vatStatus?.state === "error" ? (
                  <span className="text-muted-foreground">Could not verify VAT ID{vatStatus.detail ? `: ${vatStatus.detail}` : ""}</span>
                ) : (
                  <span className="text-muted-foreground">
                    VAT (VIES) validation is only available for EU countries.
                  </span>
                )}
              </div>
            </div>
          ) : null}

          <div className="space-y-6 pt-2">
            <h3 className="text-base font-semibold">Links</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* website - menu url */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Website
                </label>
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  disabled={!canEdit}
                  placeholder="https://yourdomain.com"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <p className="text-sm text-muted-foreground">Shown on the customer wait page.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Menu URL
                </label>
                <Input
                  value={menuUrl}
                  onChange={(e) => setMenuUrl(e.target.value)}
                  disabled={!canEdit}
                  placeholder="https://..."
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <p className="text-sm text-muted-foreground">Users will see a “View menu” button while they wait.</p>
              </div>

              {/* instagram - facebook */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Instagram
                </label>
                <Input
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  disabled={!canEdit}
                  placeholder="https://instagram.com/yourhandle"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Facebook
                </label>
                <Input
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  disabled={!canEdit}
                  placeholder="https://facebook.com/yourpage"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>

              {/* google maps - (empty) */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Google Maps
                </label>
                <Input
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  disabled={!canEdit}
                  placeholder="https://maps.app.goo.gl/..."
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <p className="text-sm text-muted-foreground">Use your Google Maps place link.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
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


