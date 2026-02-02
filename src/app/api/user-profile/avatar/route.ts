import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    const supabase = await createRouteClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });

    if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const contentType = file.type || "application/octet-stream";
    if (!contentType.startsWith("image/")) {
        return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);
    const fileExt = (file.name.split(".").pop() || "png").toLowerCase();
    const objectPath = `${user.id}/${Date.now()}.${fileExt}`;

    const admin = getAdminClient();

    // Upload to avatars bucket
    const { data: up, error: upErr } = await admin.storage
        .from("avatars")
        .upload(objectPath, buffer, { contentType, upsert: false });

    if (upErr || !up) {
        return NextResponse.json({ error: upErr?.message || "Upload failed" }, { status: 400 });
    }

    const { data: pub } = admin.storage.from("avatars").getPublicUrl(up.path);

    // Update profiles table with new avatar URL
    const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: pub.publicUrl })
        .eq("id", user.id);

    if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    return NextResponse.json({ url: pub.publicUrl });
}

export async function DELETE() {
    const supabase = await createRouteClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
}
