'use client';

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { submitSetup, completeOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";
import { getCountries, type Country } from "react-phone-number-input";
import PlanCards from "@/components/subscriptions/PlanCards";
import { isRedirectError } from "next/dist/client/components/redirect-error";

type CountryOption = { code: Country; name: string };

const setupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    businessName: z.string().min(2, "Business name must be at least 2 characters"),
    country: z.string().min(1, "Please select a country"),
    locationName: z.string().min(2, "Location name must be at least 2 characters"),
    phone: z.string().min(5, "Please enter a valid phone number"),
    listName: z.string().min(2, "List name must be at least 2 characters"),
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function OnboardingWizard({ initialStep, initialData }: { initialStep: number, initialData?: Partial<SetupFormValues> }) {
    // We now have 2 steps: 1 (Setup), 2 (Plan Selection)
    // Map existing step numbers to our new 2-step flow
    const [step, setStep] = useState(initialStep >= 2 ? 2 : 1);
    const [loading, setLoading] = useState(false);

    // setup form
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<SetupFormValues>({
        resolver: zodResolver(setupSchema),
        defaultValues: {
            name: initialData?.name || "",
            businessName: initialData?.businessName || "",
            country: initialData?.country || "US",
            locationName: initialData?.locationName || "Main Location",
            phone: initialData?.phone || "",
            listName: initialData?.listName || "Main List",
        },
    });

    const countryCode = watch("country");
    const phoneValue = watch("phone");

    const countryOptions = useMemo(() => {
        const codes = getCountries();
        const displayNames =
            typeof Intl !== "undefined" && "DisplayNames" in Intl
                ? new Intl.DisplayNames(undefined, { type: "region" })
                : null;
        return codes
            .map((code) => ({
                code,
                name: code === "US" ? "United States of America" : (displayNames?.of(code) || code),
            }))
            .sort((a, b) => a.name.localeCompare(b.name)) as CountryOption[];
    }, []);

    const selectedCountryLabel = useMemo(() => {
        const displayNames =
            typeof Intl !== "undefined" && "DisplayNames" in Intl
                ? new Intl.DisplayNames(undefined, { type: "region" })
                : null;
        if (countryCode === "US") return "United States of America";
        return displayNames?.of(countryCode) || countryCode;
    }, [countryCode]);

    async function onSubmit(data: SetupFormValues) {
        setLoading(true);
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("businessName", data.businessName);
        formData.append("country", data.country);
        formData.append("locationName", data.locationName);
        formData.append("phone", data.phone);
        formData.append("listName", data.listName);

        try {
            await submitSetup(formData);
            setStep(2);
        } catch (error) {
            console.error(error);
            const msg =
                error instanceof Error
                    ? error.message
                    : typeof error === "string"
                        ? error
                        : "Failed to save info";
            alert(msg);
        } finally {
            setLoading(false);
        }
    }

    async function handleFreeTrial() {
        setLoading(true);
        try {
            await completeOnboarding();
        } catch (error) {
            // `redirect()` in a server action can surface as a special redirect error in the client.
            // In that case, Next will handle navigation; we should not show a failure alert.
            if (isRedirectError(error)) {
                return;
            }
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function ErrorMessage({ message }: { message?: string }) {
        if (!message) return null;
        return <p className="text-[0.8rem] font-medium text-destructive">{message}</p>;
    }

    return (
        <>
            {step === 1 && (
                <div className="min-h-screen flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-lg space-y-8">
                        <Card className="w-full">
                            <CardHeader className="flex flex-col items-center">
                                <img src="/waitq-square.svg" alt="WaitQ Logo" className="h-12 w-12 mb-2" />
                                <CardTitle>Welcome to WaitQ</CardTitle>
                            </CardHeader>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <CardContent className="space-y-6">

                            {/* User Info */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className={cn(errors.name && "text-destructive")}>Your Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter your name"
                                        {...register("name")}
                                        className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
                                    />
                                    <ErrorMessage message={errors.name?.message} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="businessName" className={cn(errors.businessName && "text-destructive")}>Business Name</Label>
                                    <Input
                                        id="businessName"
                                        placeholder="Enter your business name"
                                        {...register("businessName")}
                                        className={cn(errors.businessName && "border-destructive focus-visible:ring-destructive")}
                                    />
                                    <ErrorMessage message={errors.businessName?.message} />
                                </div>                                
                            </div>

                            {/* First Location Info */}
                            <div className="space-y-4 border-border border-t pt-4">
                                <h3 className="text-sm font-medium text-muted-foreground pb-1">Lets create your first location and waitlist</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="locationName" className={cn(errors.locationName && "text-destructive")}>Location Name</Label>
                                    <Input
                                        id="locationName"
                                        placeholder="e.g. Downtown Branch"
                                        {...register("locationName")}
                                        className={cn(errors.locationName && "border-destructive focus-visible:ring-destructive")}
                                    />
                                    <ErrorMessage message={errors.locationName?.message} />
                                </div>
                                <div className="space-y-2">
                                    <Label className={cn(errors.country && "text-destructive")}>Country</Label>
                                    <Select
                                        value={countryCode}
                                        onValueChange={(val) => setValue("country", val, { shouldValidate: true })}
                                    >
                                        <SelectTrigger className={cn(errors.country && "border-destructive focus:ring-destructive")}>
                                            <SelectValue placeholder="Select a country">
                                                {selectedCountryLabel}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countryOptions.map((c) => (
                                                <SelectItem key={c.code} value={c.code}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <ErrorMessage message={errors.country?.message} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className={cn(errors.phone && "text-destructive")}>Location Phone Number</Label>
                                    <div className={cn(errors.phone && "border-destructive rounded-md border")}>
                                        <PhoneInput
                                            value={phoneValue}
                                            onChange={(val) => setValue("phone", val || "", { shouldValidate: true })}
                                            defaultCountry={countryCode as Country}
                                        />
                                    </div>
                                    <ErrorMessage message={errors.phone?.message} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="listName" className={cn(errors.listName && "text-destructive")}>Waitlist Name</Label>
                                    <Input
                                        id="listName"
                                        placeholder="e.g. Dinner List"
                                        {...register("listName")}
                                        className={cn(errors.listName && "border-destructive focus-visible:ring-destructive")}
                                    />
                                    <ErrorMessage message={errors.listName?.message} />
                                </div>
                            </div>

                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full mt-4" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Continue
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </div>
            )}

            {step === 2 && (
                <main className="py-5 animate-in fade-in duration-500">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <img src="/waitq-square.svg" alt="WaitQ Logo" className="h-16 w-16 mb-2" />
                            <h1 className="text-3xl font-bold tracking-tight">Choose your plan</h1>
                            <p className="text-lg text-muted-foreground max-w-[600px]">
                                Select the plan that best fits your business needs.
                            </p>
                        </div>

                        <PlanCards
                            mode="onboarding"
                            disabled={loading}
                            onFreeAction={handleFreeTrial}
                            successPath="/onboarding?checkout=success"
                            cancelPath="/onboarding"
                        />
                    </div>
                </main>
            )}
        </>
    );
}
