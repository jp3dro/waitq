'use server';

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";

export async function submitSetup(formData: FormData) {
    const supabase = await createClient();
    const admin = getAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const name = formData.get("name") as string;
    const businessName = formData.get("businessName") as string;
    const country = formData.get("country") as string;
    const phone = formData.get("phone") as string;
    const locationName = formData.get("locationName") as string;
    const listName = formData.get("listName") as string;

    // 1. Update User & Profile
    await supabase.auth.updateUser({
        data: { full_name: name },
    });

    const { error } = await supabase
        .from("profiles")
        .upsert(
            {
                id: user.id,
                business_name: businessName,
                country,
                phone,
                location_name: locationName,
                // Keep user on step 1 until ALL setup entities are created successfully.
                onboarding_step: 1,
            },
            { onConflict: "id" }
        );

    if (error) throw error;

    // 2. Create Business
    let businessId: string | null = null;
    const { data: existingBiz } = await admin.from("businesses").select("id").eq("owner_user_id", user.id).maybeSingle();

    if (existingBiz) {
        businessId = existingBiz.id;
        // Update existing if needed? For now assume create/update
        await admin.from("businesses").update({
            name: businessName,
            phone: phone,
            country_code: country
        }).eq("id", businessId);
    } else {
        const { data: biz, error: bizError } = await admin
            .from("businesses")
            .insert({
                owner_user_id: user.id,
                name: businessName,
                phone: phone,
                country_code: country,
                accent_color: "#000000",
                background_color: "#ffffff"
            })
            .select("id")
            .single();

        if (bizError) throw bizError;
        businessId = biz?.id;
    }

    if (!businessId) throw new Error("Failed to create business");

    // 3. Membership
    const { error: membershipErr } = await admin
        .from("memberships")
        .upsert({
            business_id: businessId,
            user_id: user.id,
            role: 'admin',
            status: 'active'
        }, { onConflict: 'user_id, business_id' });
    if (membershipErr) throw membershipErr;

    // 4. Location
    let locationId: string | null = null;
    const { data: existingLoc, error: existingLocErr } = await admin
        .from("business_locations")
        .select("id")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (existingLocErr) throw existingLocErr;

    if (existingLoc) {
        locationId = existingLoc.id;
        const { error: updateLocErr } = await admin.from("business_locations").update({ name: locationName }).eq("id", locationId);
        if (updateLocErr) throw updateLocErr;
    } else {
        const { data: location, error: insertLocErr } = await admin.from("business_locations").insert({
            business_id: businessId,
            name: locationName,
        }).select("id").single();
        if (insertLocErr) throw insertLocErr;
        locationId = location?.id || null;
    }

    // Re-resolve canonical first location for this business to avoid inserting a waitlist with a null location_id.
    // (PostgREST can omit fields in some edge cases; this makes the flow deterministic.)
    const { data: canonicalLoc, error: canonicalLocErr } = await admin
        .from("business_locations")
        .select("id")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
    if (canonicalLocErr) throw canonicalLocErr;
    locationId = (canonicalLoc?.id as string | null) || null;

    if (!locationId) throw new Error("Failed to create location");

    // 5. Waitlist
    // Final guarantee: we must have a location_id for waitlists (DB constraint).
    // If something earlier failed to produce a location row, create one now.
    if (!locationId) {
        const fallbackName = (typeof locationName === "string" && locationName.trim().length >= 2) ? locationName.trim() : "Main Location";
        const { data: fallbackLoc, error: fallbackLocErr } = await admin
            .from("business_locations")
            .insert({ business_id: businessId, name: fallbackName })
            .select("id")
            .single();
        if (fallbackLocErr) throw fallbackLocErr;
        locationId = (fallbackLoc?.id as string | null) || null;
    }

    if (!locationId) throw new Error("Failed to create location (no id returned)");

    const { data: existingWaitlist } = await admin
        .from("waitlists")
        .select("id")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (existingWaitlist?.id) {
        const { error: updateWaitlistErr } = await admin
            .from("waitlists")
            .update({ name: listName, location_id: locationId })
            .eq("id", existingWaitlist.id);
        if (updateWaitlistErr) throw updateWaitlistErr;
    } else {
        const { error: insertWaitlistErr } = await admin.from("waitlists").insert({
            business_id: businessId,
            location_id: locationId,
            name: listName,
            list_type: 'restaurants'
        });
        if (insertWaitlistErr) throw insertWaitlistErr;
    }

    // 6. Stripe
    try {
        const stripe = getStripe();
        const userEmail = user.email;
        if (userEmail) {
            let stripeCustomerId: string | null = null;
            const list = await stripe.customers.list({ email: userEmail, limit: 1 });
            if (list.data.length > 0) {
                stripeCustomerId = list.data[0].id;
            } else {
                const created = await stripe.customers.create({
                    email: userEmail,
                    metadata: { user_id: user.id }
                });
                stripeCustomerId = created.id;
            }

            await admin
                .from("subscriptions")
                .upsert(
                    {
                        user_id: user.id,
                        business_id: businessId,
                        stripe_customer_id: stripeCustomerId,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id" }
                );
        }
    } catch (e) {
        console.error("Stripe init failed", e);
    }

    // Mark setup complete ONLY after business/location/waitlist are created.
    const { error: stepErr } = await supabase
        .from("profiles")
        .upsert({ id: user.id, onboarding_step: 2 }, { onConflict: "id" });
    if (stepErr) throw stepErr;

    revalidatePath("/onboarding");
}

export async function completeOnboarding() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
    redirect("/dashboard");
}
