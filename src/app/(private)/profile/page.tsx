import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Get avatar_url from profiles table
    const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();

    const initialData = {
        name: (user.user_metadata?.full_name as string) || "",
        email: user.email || "",
        avatarUrl: (profile?.avatar_url as string | null) || null,
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
