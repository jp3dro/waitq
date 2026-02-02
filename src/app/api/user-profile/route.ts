import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET() {
    const supabase = await createRouteClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get avatar_url from profiles table
    const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();

    return NextResponse.json({
        name: user.user_metadata?.full_name || null,
        email: user.email || null,
        avatarUrl: profile?.avatar_url || null,
    });
}

const patchSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    avatarUrl: z.string().url().optional().nullable(),
});

export async function PATCH(req: NextRequest) {
    const json = await req.json();
    const parse = patchSchema.safeParse(json);
    if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

    const supabase = await createRouteClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdminClient();

    // Update name in user metadata if provided
    if (typeof parse.data.name !== "undefined") {
        const { error: authErr } = await admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
                full_name: parse.data.name,
                name: parse.data.name,
            },
        });
        if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    // Update avatar_url in profiles if provided
    if (typeof parse.data.avatarUrl !== "undefined") {
        const { error: profileErr } = await supabase
            .from("profiles")
            .update({ avatar_url: parse.data.avatarUrl })
            .eq("id", user.id);
        if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }

    // Get updated profile data
    const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();

    // Get refreshed user data
    const { data: { user: updatedUser } } = await supabase.auth.getUser();

    return NextResponse.json({
        name: updatedUser?.user_metadata?.full_name || null,
        email: updatedUser?.email || null,
        avatarUrl: profile?.avatar_url || null,
    });
}
