import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";
import ProfileClient from "./ProfileClient";
import { redirect } from "next/navigation";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
    const supabase = await createClient();
    const { user } = await getUser();
    if (!user) redirect("/login");

    // Get avatar_url from profiles table
    let avatarUrl: string | null = null;
    const profRes = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
    if (profRes?.error) {
        const msg = String(profRes.error.message || "");
        // If schema cache is stale / column missing, don't fail the whole page.
        if (!(msg.toLowerCase().includes("avatar_url") && msg.toLowerCase().includes("schema cache"))) {
            console.error("[profile] Failed to load avatar_url:", profRes.error);
        }
    } else {
        avatarUrl = (profRes.data?.avatar_url as string | null) || null;
    }

    const initialData = {
        name: (user.user_metadata?.full_name as string) || "",
        email: user.email || "",
        avatarUrl,
    };

    return (
        <main className="py-5">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-6">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                        <p className="text-muted-foreground mt-1">Manage your personal settings</p>
                    </div>
                </div>

                <ProfileClient initial={initialData} />
            </div>
        </main>
    );
}
