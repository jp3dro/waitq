import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingWizard from "./wizard";
import { syncSubscriptionForUser } from "@/lib/subscription-sync";
import { getAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function OnboardingPage({
    searchParams,
}: {
    searchParams?: SearchParams | Promise<SearchParams>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const sp = await Promise.resolve(searchParams ?? {});
    const checkout =
        typeof sp.checkout === "string" ? sp.checkout : Array.isArray(sp.checkout) ? sp.checkout[0] : undefined;
    const sessionId =
        typeof sp.session_id === "string" ? sp.session_id : Array.isArray(sp.session_id) ? sp.session_id[0] : undefined;

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    // If coming back from Stripe Checkout, try to confirm subscription and complete onboarding.
    // This prevents a loop where `/subscriptions` is gated behind `onboarding_completed`.
    if (checkout === "success") {
        let hasActiveSubscription = false;
        let shouldRedirect = false;

        // 1) Prefer deterministic verification using the checkout session id (no webhook timing/race).
        if (sessionId) {
            try {
                const stripe = getStripe();
                const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
                const isPaid = session.payment_status === "paid";
                const sub = session.subscription as any;
                const status = typeof sub?.status === "string" ? sub.status : null;
                const isActiveLike = status === "active" || status === "trialing" || status === "past_due";
                
                if (isPaid && isActiveLike) {
                    hasActiveSubscription = true;
                    shouldRedirect = true;
                }
            } catch (e) {
                console.error("[onboarding] Failed to retrieve checkout session from Stripe:", e);
                // Continue to fallback sync below
            }
        }

        // 2) Fallback: sync by user/email and infer plan (handles webhook delays or session lookup failures).
        if (!hasActiveSubscription) {
            try {
                const synced = await syncSubscriptionForUser({ userId: user.id, email: user.email });
                hasActiveSubscription = synced.planId === "base" || synced.planId === "premium";
                if (hasActiveSubscription) {
                    shouldRedirect = true;
                }
            } catch (e) {
                console.error("[onboarding] Failed to sync subscription during onboarding return:", e);
            }
        }

        // 3) If we confirmed an active paid subscription, complete onboarding and redirect.
        if (shouldRedirect && hasActiveSubscription) {
            // Sync once more to ensure DB is fully up-to-date before redirect
            await syncSubscriptionForUser({ userId: user.id, email: user.email });
            const admin = getAdminClient();
            await admin
                .from("profiles")
                .upsert({ id: user.id, onboarding_completed: true, onboarding_step: 3 }, { onConflict: "id" });
            // redirect() throws NEXT_REDIRECT which is expected Next.js behavior - don't catch it
            redirect("/dashboard");
        }
    }

    // Fetch existing business/location/list info if available to pre-fill (canonical tables first)
    const { data: business } = await supabase
        .from("businesses")
        .select("id, name, phone, country_code")
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

    const hasSetupData = !!businessId && !!location?.id && !!listName.trim();

    const initialData = {
        name: user.user_metadata?.full_name || "",
        businessName: business?.name || profile?.business_name || "",
        country: business?.country_code || profile?.country || "US",
        locationName: location?.name || profile?.location_name || "",
        phone: business?.phone || profile?.phone || "",
        listName: listName,
    };

    return (
        <OnboardingWizard initialStep={hasSetupData ? (profile?.onboarding_step || 1) : 1} initialData={initialData} />
    );
}
