"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Popover } from "@/components/ui/tooltip";

type Customization = {
  id: string;
  accent_color: string | null;
  background_color: string | null;
  cover_url: string | null;
  logo_url: string | null;
};

const IOS_COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Red", value: "#FF3B30" },
  { name: "Orange", value: "#FF9500" },
  { name: "Yellow", value: "#FFCC00" },
  { name: "Green", value: "#34C759" },
  { name: "Teal", value: "#30B0C7" },
  { name: "Blue", value: "#007AFF" },
  { name: "Purple", value: "#AF52DE" },
];

function classNames(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function CustomizationClient({ initial }: { initial?: { accent_color: string | null; background_color: string | null; cover_url: string | null; logo_url?: string | null } }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accent, setAccent] = useState<string>("#FFFFFF");
  const [useCustomAccent, setUseCustomAccent] = useState(false);
  const [customAccent, setCustomAccent] = useState<string>("#000000");

  // Background color controls removed from internal UI per brand-scoping change

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Hydrate from server-provided initial to avoid flicker
    if (initial) {
      const ac = initial.accent_color || IOS_COLORS[0].value;
      setAccent(ac);
      setUseCustomAccent(!IOS_COLORS.some((c) => c.value.toLowerCase() === ac.toLowerCase()));
      if (!IOS_COLORS.some((c) => c.value.toLowerCase() === ac.toLowerCase())) setCustomAccent(ac);
      setCoverUrl(initial.cover_url || null);
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
          const ac = json.customization.accent_color || IOS_COLORS[0].value;
          setAccent(ac);
          setUseCustomAccent(!IOS_COLORS.some((c) => c.value.toLowerCase() === ac.toLowerCase()));
          if (!IOS_COLORS.some((c) => c.value.toLowerCase() === ac.toLowerCase())) setCustomAccent(ac);
          setCoverUrl(json.customization.cover_url || null);
          setLogoUrl(json.customization.logo_url || null);
        } else {
          setAccent("#FFFFFF");
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

  const effectiveAccent = useMemo(() => (useCustomAccent ? customAccent : accent), [useCustomAccent, customAccent, accent]);

  async function saveCustomization() {
    setSaving(true);
    try {
      const res = await fetch("/api/customization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          accentColor: effectiveAccent,
          coverUrl: coverUrl,
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

  async function handleUpload(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large (max 5MB)");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await fetch("/api/profile/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Upload failed");
      setCoverUrl(j.url);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
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
      {/* Brand color */}
      <section>
        <div className="text-sm font-medium">Brand color</div>
        <div className="mt-2 flex gap-2">
          {IOS_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => {
                setUseCustomAccent(false);
                setAccent(c.value);
              }}
              className={classNames(
                "h-8 w-8 rounded-lg ring-1 ring-border shadow-sm",
                !useCustomAccent && accent.toLowerCase() === c.value.toLowerCase() ? "ring-2 ring-offset-2 ring-ring" : "hover:ring-2 hover:ring-ring/60"
              )}
              style={{ backgroundColor: c.value }}
              aria-label={c.name}
            />
          ))}
          {/* Custom color */}
          {useCustomAccent ? (
            <Popover
              content={
                <div className="p-2">
                  <input
                    type="text"
                    value={customAccent}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#?[0-9a-fA-F]{0,6}$/.test(v.replace("#", ""))) {
                        setCustomAccent(v.startsWith("#") ? v : `#${v}`);
                      }
                    }}
                    maxLength={7}
                    placeholder="#000000"
                    className="h-8 w-28 rounded-md border border-border px-2 text-xs font-mono bg-white"
                  />
                </div>
              }
              side="bottom"
            >
              <button
                type="button"
                className="h-8 w-8 rounded-lg ring-2 ring-offset-2 ring-ring shadow-sm"
                style={{ backgroundColor: customAccent }}
                aria-label="Custom color"
              />
            </Popover>
          ) : (
            <button
              type="button"
              onClick={() => setUseCustomAccent(true)}
              className="h-8 w-8 rounded-lg ring-1 ring-border shadow-sm hover:ring-2 hover:ring-ring/60 flex items-center justify-center bg-muted"
              aria-label="Add custom color"
            >
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </section>

      {/* Cover image */}
      <section>
        <div className="text-sm font-medium">Cover image</div>
        <div className="mt-2 grid md:grid-cols-[160px_1fr] items-start gap-4">
          <div className="h-24 w-40 rounded-md ring-1 ring-border overflow-hidden bg-muted flex items-center justify-center">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-neutral-500">No cover</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm px-3 h-8 rounded-md border border-border bg-card hover:bg-muted disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload image"}
            </button>
            {coverUrl && (
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/profile/upload", { method: "DELETE" });
                  if (res.ok) setCoverUrl(null);
                }}
                className="text-sm px-3 h-8 rounded-md border border-border"
              >
                Remove
              </button>
            )}
            <div className="text-xs text-muted-foreground">PNG/JPG. Max 5 MB.</div>
          </div>
        </div>
      </section>

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
        <button
          type="button"
          onClick={() => void saveCustomization()}
          disabled={loading || saving}
          className="action-btn action-btn--primary disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}


