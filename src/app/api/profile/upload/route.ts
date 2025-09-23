import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  // Basic type check
  const contentType = file.type || "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  // Identify the user's business (first by created_at)
  const { data: biz, error: bizErr } = await supabase
    .from("businesses")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  if (bizErr || !biz) return NextResponse.json({ error: "No business found" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = new Uint8Array(bytes);
  const fileExt = (file.name.split(".").pop() || "png").toLowerCase();
  const objectPath = `${biz.id}/${Date.now()}.${fileExt}`;

  const { data: uploadData, error: uploadErr } = await supabase.storage.from("logos").upload(objectPath, buffer, {
    contentType,
    upsert: false,
  });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 400 });

  const { data: pub } = supabase.storage.from("logos").getPublicUrl(uploadData.path);
  return NextResponse.json({ url: pub.publicUrl });
}


