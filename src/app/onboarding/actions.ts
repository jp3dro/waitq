'use server';

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";

async function requireUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    return { supabase, user };
}

async function resolveOrCreateBusinessId({
    admin,
    userId,
    businessName,
    country,
}: {
    admin: ReturnType<typeof getAdminClient>;
    userId: string;
    businessName: string;
    country: string;
}) {
    const { data: existingBiz, error } = await admin
        .from("businesses")
        .select("id, phone")
        .eq("owner_user_id", userId)
        .maybeSingle();
    if (error) throw error;

    if (existingBiz?.id) {
        const { error: updateErr } = await admin
            .from("businesses")
            .update({
                name: businessName,
                country_code: country,
            })
            .eq("id", existingBiz.id);
        if (updateErr) throw updateErr;
        return existingBiz.id as string;
    }

    const { data: biz, error: bizError } = await admin
        .from("businesses")
        .insert({
            owner_user_id: userId,
            name: businessName,
            country_code: country,
            accent_color: "#000000",
            background_color: "#ffffff",
        })
        .select("id")
        .single();
    if (bizError) throw bizError;
    const businessId = (biz?.id as string | undefined) || null;
    if (!businessId) throw new Error("Failed to create business");
    return businessId;
}

async function resolveOrCreateFirstLocationId({
    admin,
    businessId,
    locationName,
}: {
    admin: ReturnType<typeof getAdminClient>;
    businessId: string;
    locationName: string;
}) {
    const { data: existingLoc, error: existingLocErr } = await admin
        .from("business_locations")
        .select("id")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (existingLocErr) throw existingLocErr;

    if (existingLoc?.id) {
        const { error: updateLocErr } = await admin
            .from("business_locations")
            .update({ name: locationName })
            .eq("id", existingLoc.id);
        if (updateLocErr) throw updateLocErr;
    } else {
        const { error: insertLocErr } = await admin
            .from("business_locations")
            .insert({ business_id: businessId, name: locationName })
            .select("id")
            .single();
        if (insertLocErr) throw insertLocErr;
    }

    // Canonical first location
    const { data: canonicalLoc, error: canonicalLocErr } = await admin
        .from("business_locations")
        .select("id")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
    if (canonicalLocErr) throw canonicalLocErr;
    const locationId = (canonicalLoc?.id as string | undefined) || null;
    if (!locationId) throw new Error("Failed to create location");
    return locationId;
}

export async function submitUserInfo(formData: FormData) {
    const { supabase, user } = await requireUser();
    const name = (formData.get("name") as string | null)?.trim() || "";
    if (name.length < 2) throw new Error("Name must be at least 2 characters");

    await supabase.auth.updateUser({ data: { full_name: name } });
    const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, onboarding_step: 2 }, { onConflict: "id" });
    if (error) throw error;
    revalidatePath("/onboarding");
}

export async function submitBusinessInfo(formData: FormData) {
    const { supabase, user } = await requireUser();
    const admin = getAdminClient();

    const businessName = (formData.get("businessName") as string | null)?.trim() || "";
    const country = (formData.get("country") as string | null)?.trim() || "";
    const vatId = (formData.get("vatId") as string | null)?.trim() || "";
    if (businessName.length < 2) throw new Error("Business name must be at least 2 characters");
    if (!country) throw new Error("Please select a country");

    const businessId = await resolveOrCreateBusinessId({
        admin,
        userId: user.id,
        businessName,
        country,
    });

    // Handle VAT data if provided
    if (vatId) {
        try {
            const vatRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/vat/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ countryCode: country, vatId }),
            });
            const vatData = await vatRes.json();

            const updateData: Record<string, any> = {
                vat_id: vatId,
                vat_id_valid: vatData.valid,
                vat_id_validated_at: new Date().toISOString(),
            };

            if (vatData.valid) {
                updateData.vat_id_name = vatData.name;
                updateData.vat_id_address = vatData.address;
            }

            await admin
                .from("businesses")
                .update(updateData)
                .eq("id", businessId);
        } catch (error) {
            console.error("VAT validation failed:", error);
            // Continue without VAT data rather than failing the whole process
        }
    }

    // Membership
    const { error: membershipErr } = await admin
        .from("memberships")
        .upsert(
            { business_id: businessId, user_id: user.id, role: "admin", status: "active" },
            { onConflict: "user_id, business_id" }
        );
    if (membershipErr) throw membershipErr;

    // Persist to profile for prefill
    const { error: profileErr } = await supabase
        .from("profiles")
        .upsert(
            { id: user.id, business_name: businessName, country, vat_id: vatId || null, onboarding_step: 3 },
            { onConflict: "id" }
        );
    if (profileErr) throw profileErr;

    // Stripe customer bootstrap (optional, but helps subscription UX)
    try {
        const stripe = getStripe();
        const userEmail = user.email;
        if (userEmail) {
            let stripeCustomerId: string | null = null;
            const list = await stripe.customers.list({ email: userEmail, limit: 1 });
            stripeCustomerId = list.data.length > 0 ? list.data[0].id : null;
            if (!stripeCustomerId) {
                const created = await stripe.customers.create({
                    email: userEmail,
                    metadata: { user_id: user.id },
                });
                stripeCustomerId = created.id;
            }
            await admin.from("subscriptions").upsert(
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

    revalidatePath("/onboarding");
}

export async function submitLocationInfo(formData: FormData) {
    const { supabase, user } = await requireUser();
    const admin = getAdminClient();

    const locationName = (formData.get("locationName") as string | null)?.trim() || "";
    const phone = (formData.get("phone") as string | null)?.trim() || "";
    if (locationName.length < 2) throw new Error("Location name must be at least 2 characters");
    if (phone.length < 5) throw new Error("Please enter a valid phone number");

    // Resolve business
    const { data: business, error: bizErr } = await admin
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (bizErr) throw bizErr;
    const businessId = (business?.id as string | undefined) || null;
    if (!businessId) throw new Error("Business not found; please complete the previous step.");

    await resolveOrCreateFirstLocationId({ admin, businessId, locationName });

    // Update business phone using the location phone (current behavior)
    await admin.from("businesses").update({ phone }).eq("id", businessId);

    const { error: profileErr } = await supabase
        .from("profiles")
        .upsert(
            { id: user.id, phone, location_name: locationName, onboarding_step: 4 },
            { onConflict: "id" }
        );
    if (profileErr) throw profileErr;

    revalidatePath("/onboarding");
}

export async function submitWaitlistInfo(formData: FormData) {
    const { supabase, user } = await requireUser();
    const admin = getAdminClient();

    const listName = (formData.get("listName") as string | null)?.trim() || "";
    if (listName.length < 2) throw new Error("List name must be at least 2 characters");

    const { data: business, error: bizErr } = await admin
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (bizErr) throw bizErr;
    const businessId = (business?.id as string | undefined) || null;
    if (!businessId) throw new Error("Business not found; please complete the previous steps.");

    const { data: loc, error: locErr } = await admin
        .from("business_locations")
        .select("id, name")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (locErr) throw locErr;
    let locationId = (loc?.id as string | undefined) || null;
    if (!locationId) {
        // Last-resort fallback
        const { data: fallbackLoc, error: fallbackLocErr } = await admin
            .from("business_locations")
            .insert({ business_id: businessId, name: "Main Location" })
            .select("id")
            .single();
        if (fallbackLocErr) throw fallbackLocErr;
        locationId = (fallbackLoc?.id as string | undefined) || null;
    }
    if (!locationId) throw new Error("Failed to create location (no id returned)");

    const { data: existingWaitlist, error: wlErr } = await admin
        .from("waitlists")
        .select("id")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (wlErr) throw wlErr;

    const defaults = {
        kiosk_enabled: true,
        display_enabled: true,
        display_show_name: true,
        display_show_qr: false,
        seating_preferences: [] as string[],
        ask_name: true,
        ask_phone: true,
        ask_email: false,
        list_type: "restaurants",
    };

    if (existingWaitlist?.id) {
        const { error: updateWaitlistErr } = await admin
            .from("waitlists")
            .update({
                name: listName,
                location_id: locationId,
                ...defaults,
            })
            .eq("id", existingWaitlist.id);
        if (updateWaitlistErr) throw updateWaitlistErr;
    } else {
        const { error: insertWaitlistErr } = await admin
            .from("waitlists")
            .insert({
                business_id: businessId,
                location_id: locationId,
                name: listName,
                ...defaults,
            });
        if (insertWaitlistErr) throw insertWaitlistErr;
    }

    const { error: profileErr } = await supabase
        .from("profiles")
        .upsert({ id: user.id, onboarding_step: 5 }, { onConflict: "id" });
    if (profileErr) throw profileErr;

    revalidatePath("/onboarding");
}

// Back-compat: previous combined setup action
export async function submitSetup(formData: FormData) {
    await submitUserInfo(formData);
    await submitBusinessInfo(formData);
    await submitLocationInfo(formData);
    await submitWaitlistInfo(formData);
}

export async function completeOnboarding() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    await supabase
        .from("profiles")
        .update({ onboarding_completed: true, onboarding_step: 5 })
        .eq("id", user.id);
    redirect("/lists");
}
