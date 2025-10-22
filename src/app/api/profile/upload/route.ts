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

  // Basic type check
  const contentType = file.type || "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  // Identify the user's business by owner id
  const { data: biz, error: bizErr } = await supabase
    .from("businesses")
    .select("id, cover_path")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (bizErr || !biz) return NextResponse.json({ error: "No business found" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = new Uint8Array(bytes);
  const fileExt = (file.name.split(".").pop() || "png").toLowerCase();
  const objectPath = `${biz.id}/${Date.now()}.${fileExt}`;

  const admin = getAdminClient();
  const { data: uploadData, error: uploadErr } = await admin.storage.from("covers").upload(objectPath, buffer, {
    contentType,
    upsert: false,
  });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 400 });

  // Delete previous cover if exists
  if (biz.cover_path) {
    await admin.storage.from("covers").remove([biz.cover_path]);
  }

  // Save new cover path/url on the business
  const { data: pub } = admin.storage.from("covers").getPublicUrl(uploadData.path);
  await supabase
    .from("businesses")
    .update({ cover_path: uploadData.path, cover_url: pub.publicUrl })
    .eq("id", biz.id);

  return NextResponse.json({ url: pub.publicUrl, path: uploadData.path });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: biz, error: bizErr } = await supabase
    .from("businesses")
    .select("id, cover_path")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (bizErr || !biz) return NextResponse.json({ error: "No business found" }, { status: 400 });

  const admin = getAdminClient();
  if (biz.cover_path) {
    await admin.storage.from("covers").remove([biz.cover_path]);
  }

  const { error: updErr } = await supabase
    .from("businesses")
    .update({ cover_path: null, cover_url: null })
    .eq("id", biz.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}


