"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Customization = {
  id: string;
  accent_color: string | null;
  background_color: string | null;
  cover_url: string | null;
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

export default function CustomizationClient({ initial }: { initial?: { accent_color: string | null; background_color: string | null; cover_url: string | null } }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accent, setAccent] = useState<string>("#FFFFFF");
  const [useCustomAccent, setUseCustomAccent] = useState(false);
  const [customAccent, setCustomAccent] = useState<string>("#000000");

  const [background, setBackground] = useState<string>("#000000");

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Hydrate from server-provided initial to avoid flicker
    if (initial) {
      const ac = initial.accent_color || IOS_COLORS[0].value;
      const bg = initial.background_color || "#FFFFFF";
      setAccent(ac);
      setUseCustomAccent(!IOS_COLORS.some((c) => c.value.toLowerCase() === ac.toLowerCase()));
      if (!IOS_COLORS.some((c) => c.value.toLowerCase() === ac.toLowerCase())) setCustomAccent(ac);
      setBackground(bg);
      setCoverUrl(initial.cover_url || null);
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
          const bg = json.customization.background_color || "#000000";
          setAccent(ac);
          setUseCustomAccent(!IOS_COLORS.some((c) => c.value.toLowerCase() === ac.toLowerCase()));
          if (!IOS_COLORS.some((c) => c.value.toLowerCase() === ac.toLowerCase())) setCustomAccent(ac);
          setBackground(bg);
          setCoverUrl(json.customization.cover_url || null);
        } else {
          setAccent("#FFFFFF");
          setBackground("#000000");
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
          backgroundColor: background,
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

  return (
    <div className="space-y-8">
      {/* Accent color */}
      <section>
        <div className="text-sm font-medium">Accent color</div>
        <div className="mt-2 grid grid-cols-9 gap-3">
          {IOS_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => {
                setUseCustomAccent(false);
                setAccent(c.value);
              }}
              className={classNames(
                "h-10 w-10 rounded-lg ring-1 ring-black/10 shadow-sm",
                !useCustomAccent && accent.toLowerCase() === c.value.toLowerCase() ? "ring-2 ring-offset-2 ring-black" : "hover:ring-2 hover:ring-black/30"
              )}
              style={{ backgroundColor: c.value }}
              aria-label={c.name}
            />
          ))}
          {/* 9th: custom */}
          <div className="col-span-9 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setUseCustomAccent(true)}
              className={classNames(
                "h-10 w-10 rounded-lg ring-1 ring-black/10 bg-[image:linear-gradient(45deg,_#ccc_25%,_transparent_25%),linear-gradient(-45deg,_#ccc_25%,_transparent_25%),linear-gradient(45deg,_transparent_75%,_#ccc_75%),linear-gradient(-45deg,_transparent_75%,_#ccc_75%)] bg-[length:10px_10px] bg-[position:0_0,0_5px,5px_-5px,-5px_0]",
                useCustomAccent ? "ring-2 ring-offset-2 ring-black" : "hover:ring-2 hover:ring-black/30"
              )}
              aria-label="Custom color"
            />
            <input
              type="color"
              value={customAccent}
              onChange={(e) => {
                setUseCustomAccent(true);
                setCustomAccent(e.target.value);
              }}
              className="h-9 w-12 rounded-md border border-neutral-200"
            />
            <input
              type="text"
              value={customAccent}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#?[0-9a-fA-F]{0,6}$/.test(v.replace("#", ""))) {
                  setUseCustomAccent(true);
                  setCustomAccent(v.startsWith("#") ? v : `#${v}`);
                }
              }}
              maxLength={7}
              placeholder="#000000"
              className="h-9 w-28 rounded-md border border-neutral-200 px-2 text-xs font-mono"
            />
          </div>
        </div>
      </section>

      {/* Background color */}
      <section>
        <div className="text-sm font-medium">Background color</div>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="color"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className="h-8 w-12 rounded-md border border-neutral-200"
          />
          <input
            type="text"
            value={background}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#?[0-9a-fA-F]{0,6}$/.test(v.replace("#", ""))) {
                const vv = v.startsWith("#") ? v : `#${v}`;
                setBackground(vv);
              }
            }}
            maxLength={7}
            placeholder="#FFFFFF"
            className="h-8 w-28 rounded-md border border-neutral-200 px-2 text-xs font-mono"
          />
        </div>
      </section>

      {/* Cover image */}
      <section>
        <div className="text-sm font-medium">Cover image</div>
        <div className="mt-2 grid md:grid-cols-[160px_1fr] items-start gap-4">
          <div className="h-24 w-40 rounded-md ring-1 ring-neutral-200 overflow-hidden bg-neutral-50 flex items-center justify-center">
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
              className="text-sm px-3 h-8 rounded-md bg-black text-white disabled:opacity-60"
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
                className="text-sm px-3 h-8 rounded-md border border-neutral-200"
              >
                Remove
              </button>
            )}
            <div className="text-xs text-neutral-600">PNG/JPG. Max 5 MB.</div>
          </div>
        </div>
      </section>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => void saveCustomization()}
          disabled={loading || saving}
          className="text-sm px-4 h-9 rounded-md bg-black text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}


