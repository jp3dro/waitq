import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingWizard from "./wizard";
import { syncPolarSubscriptionForUser } from "@/lib/polar-sync";
import { getAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";

export const metadata: Metadata = {
    title: "Get Started",
    description: "Set up your WaitQ account and start managing your restaurant waitlist.",
    robots: {
        index: false,
        follow: false,
    },
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function OnboardingPage(props: {
    searchParams: Promise<SearchParams>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const sp = await props.searchParams;
    const checkout =
        typeof sp.checkout === "string" ? sp.checkout : Array.isArray(sp.checkout) ? sp.checkout[0] : undefined;

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    // If onboarding is already completed, skip.
    if (profile?.onboarding_completed) {
        redirect("/lists");
    }

    // If user is an active *member* of an organization they do NOT own, skip onboarding.
    const { data: membership } = await supabase
        .from("memberships")
        .select("id, business_id, businesses(owner_user_id)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    const membershipOwnerId = (membership?.businesses as any)?.owner_user_id as string | undefined;
    const isMemberNotOwner = !!membership?.id && !!membershipOwnerId && membershipOwnerId !== user.id;
    if (isMemberNotOwner) {
        redirect("/lists");
    }

    // If coming back from Polar Checkout, try to confirm subscription and complete onboarding.
    if (checkout === "success") {
        let hasActiveSubscription = false;

        try {
            const synced = await syncPolarSubscriptionForUser({ userId: user.id });
            hasActiveSubscription = synced.planId === "base" || synced.planId === "premium";
        } catch (e) {
            console.error("[onboarding] Failed to sync subscription during onboarding return:", e);
        }

        // If we confirmed an active paid subscription, complete onboarding and redirect.
        if (hasActiveSubscription) {
            const admin = getAdminClient();
            await admin
                .from("profiles")
                .upsert({ id: user.id, onboarding_completed: true, onboarding_step: 5 }, { onConflict: "id" });
            redirect("/lists");
        }
    }

    // Fetch existing business/location/list info if available to pre-fill
    const { data: business } = await supabase
        .from("businesses")
        .select("id, name, country_code")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    const businessId = business?.id ?? null;

    const { data: location } = businessId
        ? await supabase
            .from("business_locations")
            .select("id, name")
            .eq("business_id", businessId)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle()
        : { data: null };

    let listName = "";
    if (businessId) {
        const { data: waitlist } = await supabase
            .from("waitlists")
            .select("name")
            .eq("business_id", businessId)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
        if (waitlist) {
            listName = waitlist.name;
        }
    }

    const clampStep = (s: unknown) => {
        const n = typeof s === "number" && isFinite(s) ? s : 1;
        return Math.max(1, Math.min(5, Math.round(n)));
    };
    const hasSetupData = !!businessId && !!location?.id && !!listName.trim();
    const inferredStep = (() => {
        const persisted = clampStep(profile?.onboarding_step);
        if (hasSetupData) return Math.max(persisted, 5);
        return persisted;
    })();

    // Best-effort country prefill from geo headers
    const h = await headers();
    const inferredCountry = (() => {
        const raw =
            h.get("x-vercel-ip-country") ||
            h.get("cf-ipcountry") ||
            h.get("x-country-code") ||
            h.get("x-geo-country") ||
            null;
        if (!raw) return null;
        const c = raw.trim().toUpperCase();
        if (c.length !== 2) return null;
        if (c === "XX") return null;
        return c;
    })();

    const initialData = {
        name: user.user_metadata?.full_name || "",
        businessName: business?.name || profile?.business_name || "",
        country: business?.country_code || profile?.country || inferredCountry || "US",
        locationName: location?.name || profile?.location_name || "",
        listName: listName,
    };

    return (
        <OnboardingWizard initialStep={inferredStep} initialData={initialData} />
    );
}
