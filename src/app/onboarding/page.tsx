import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingWizard from "./wizard";
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

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    // If coming back from Stripe Checkout, try to confirm subscription and complete onboarding.
    // This prevents a loop where `/subscriptions` is gated behind `onboarding_completed`.
    if (checkout === "success") {
        try {
            const stripe = getStripe();
            const { data: subRow } = await supabase
                .from("subscriptions")
                .select("stripe_customer_id")
                .eq("user_id", user.id)
                .maybeSingle();

            const customerId = (subRow?.stripe_customer_id as string | null) || null;
            if (customerId) {
                const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
                const activeLike = new Set(["active", "trialing", "past_due"]);
                const hasActive = subs.data.some((s) => activeLike.has(s.status as string));
                if (hasActive) {
                    await supabase
                        .from("profiles")
                        .upsert({ id: user.id, onboarding_completed: true, onboarding_step: 3 }, { onConflict: "id" });
                    redirect("/dashboard");
                }
            }
        } catch {
            // If Stripe verification fails here, we fall back to rendering step 2 so user can retry.
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
