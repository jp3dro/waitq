'use client';

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { submitUserInfo, submitBusinessInfo, submitLocationInfo, submitWaitlistInfo, completeOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getCountries, type Country } from "react-phone-number-input";
import PlanCards from "@/components/subscriptions/PlanCards";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isEuCountry } from "@/lib/eu";

type CountryOption = { code: Country; name: string };

const userInfoSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
});
const businessInfoSchema = z.object({
    businessName: z.string().min(2, "Business name must be at least 2 characters"),
    country: z.string().min(1, "Please select a country"),
    vatId: z.string().optional(),
});
const locationInfoSchema = z.object({
    locationName: z.string().min(2, "Location name must be at least 2 characters"),
});
const waitlistInfoSchema = z.object({
    listName: z.string().min(2, "List name must be at least 2 characters"),
});

type SetupFormValues = {
    name: string;
    businessName: string;
    country: string;
    vatId: string;
    locationName: string;
    listName: string;
};

function clampStep(step: unknown) {
    const n = typeof step === "number" && isFinite(step) ? Math.round(step) : 1;
    return Math.max(1, Math.min(5, n));
}

export default function OnboardingWizard({ initialStep, initialData }: { initialStep: number, initialData?: Partial<SetupFormValues> }) {
    const [step, setStep] = useState(clampStep(initialStep));
    const [loading, setLoading] = useState(false);
    const [vatValidation, setVatValidation] = useState<{
        valid: boolean | null;
        name?: string | null;
        address?: string | null;
        reason?: string;
    } | null>(null);

    const {
        register,
        setValue,
        watch,
        getValues,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<SetupFormValues>({
        defaultValues: {
            name: initialData?.name || "",
            businessName: initialData?.businessName || "",
            country: initialData?.country || "US",
            vatId: initialData?.vatId || "",
            locationName: initialData?.locationName || "Main Location",
            listName: initialData?.listName || "Main List",
        },
    });

    const countryCode = watch("country");
    const vatIdValue = watch("vatId");

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

    function ErrorMessage({ message }: { message?: string }) {
        if (!message) return null;
        return <p className="text-[0.8rem] font-medium text-destructive">{message}</p>;
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

    const progressValue = Math.round(((step - 1) / 4) * 100);

    const validateAndPersistCurrentStep = async () => {
        const values = getValues();

        const fail = (schema: z.ZodSchema<any>, fields: (keyof SetupFormValues)[]) => {
            clearErrors(fields as any);
            const subset: Record<string, unknown> = {};
            for (const f of fields) subset[f] = values[f];
            const parsed = schema.safeParse(subset);
            if (parsed.success) return { ok: true as const };
            for (const issue of parsed.error.issues) {
                const key = issue.path[0];
                if (typeof key === "string") {
                    setError(key as any, { type: "validate", message: issue.message });
                }
            }
            return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Please check the form." };
        };

        if (step === 1) {
            const check = fail(userInfoSchema, ["name"]);
            if (!check.ok) return check;
            const fd = new FormData();
            fd.append("name", values.name);
            await submitUserInfo(fd);
            return { ok: true as const };
        }

        if (step === 2) {
            const check = fail(businessInfoSchema, ["businessName", "country", "vatId"]);
            if (!check.ok) return check;
            const fd = new FormData();
            fd.append("businessName", values.businessName);
            fd.append("country", values.country);
            fd.append("vatId", values.vatId);
            await submitBusinessInfo(fd);
            return { ok: true as const };
        }

        if (step === 3) {
            const check = fail(locationInfoSchema, ["locationName"]);
            if (!check.ok) return check;
            const fd = new FormData();
            fd.append("locationName", values.locationName);
            await submitLocationInfo(fd);
            return { ok: true as const };
        }

        if (step === 4) {
            const check = fail(waitlistInfoSchema, ["listName"]);
            if (!check.ok) return check;
            const fd = new FormData();
            fd.append("listName", values.listName);
            await submitWaitlistInfo(fd);
            return { ok: true as const };
        }

        return { ok: true as const };
    };

    async function onNext() {
        if (step >= 5) return;
        setLoading(true);
        try {
            const res = await validateAndPersistCurrentStep();
            if (!res.ok) return;
            setStep((s) => Math.min(5, s + 1));
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

    return (
        <>
            {step === 5 ? (
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
            ) : (
                <div className="min-h-screen flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-lg space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Step {step} of 5</span>
                            </div>
                            <Progress value={progressValue} />
                        </div>

                        <Card className="w-full">
                            <CardHeader className="flex flex-col items-center">
                                <img src="/waitq-square.svg" alt="WaitQ Logo" className="h-12 w-12 mb-2" />
                                <CardTitle>
                                    {step === 1
                                        ? "Tell us about you"
                                        : step === 2
                                            ? "Business details"
                                            : step === 3
                                                ? "Your first location"
                                                : "Your first waitlist"}
                                </CardTitle>
                            </CardHeader>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    void onNext();
                                }}
                            >
                                <CardContent className="space-y-6">
                                    {step === 1 ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className={cn(errors.name && "text-destructive")}>
                                                Your Name
                                            </Label>
                                            <Input
                                                id="name"
                                                placeholder="Enter your name"
                                                {...register("name")}
                                                className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
                                            />
                                            <ErrorMessage message={errors.name?.message} />
                                        </div>
                                    ) : null}

                                    {step === 2 ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="businessName" className={cn(errors.businessName && "text-destructive")}>
                                                    Business Name
                                                </Label>
                                                <Input
                                                    id="businessName"
                                                    placeholder="Enter your business name"
                                                    {...register("businessName")}
                                                    className={cn(errors.businessName && "border-destructive focus-visible:ring-destructive")}
                                                />
                                                <ErrorMessage message={errors.businessName?.message} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className={cn(errors.country && "text-destructive")}>Country</Label>
                                                <Select value={countryCode} onValueChange={(val) => {
                                                    setValue("country", val);
                                                    setValue("vatId", ""); // Clear VAT ID when country changes
                                                    setVatValidation(null); // Clear validation
                                                }}>
                                                    <SelectTrigger className={cn(errors.country && "border-destructive focus:ring-destructive")}>
                                                        <SelectValue placeholder="Select a country">{selectedCountryLabel}</SelectValue>
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

                                            {isEuCountry(countryCode) && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="vatId" className={cn(errors.vatId && "text-destructive")}>
                                                        VAT ID <span className="text-sm text-muted-foreground">(optional)</span>
                                                    </Label>
                                                    <Input
                                                        id="vatId"
                                                        placeholder="e.g. PT123456789"
                                                        {...register("vatId")}
                                                        className={cn(errors.vatId && "border-destructive focus-visible:ring-destructive")}
                                                        onChange={(e) => {
                                                            register("vatId").onChange(e);
                                                            // Clear validation when user starts typing
                                                            if (vatValidation && e.target.value !== vatIdValue) {
                                                                setVatValidation(null);
                                                            }
                                                        }}
                                                        onBlur={async (e) => {
                                                            const value = e.target.value.trim();
                                                            if (value && isEuCountry(countryCode)) {
                                                                try {
                                                                    const res = await fetch("/api/vat/validate", {
                                                                        method: "POST",
                                                                        headers: { "Content-Type": "application/json" },
                                                                        body: JSON.stringify({ countryCode, vatId: value }),
                                                                    });
                                                                    const data = await res.json();
                                                                    setVatValidation({
                                                                        valid: data.valid,
                                                                        name: data.name,
                                                                        address: data.address,
                                                                        reason: data.reason,
                                                                    });
                                                                } catch (error) {
                                                                    setVatValidation({
                                                                        valid: null,
                                                                        reason: "Failed to validate VAT ID",
                                                                    });
                                                                }
                                                            } else {
                                                                setVatValidation(null);
                                                            }
                                                        }}
                                                    />
                                                    <ErrorMessage message={errors.vatId?.message} />
                                                    {vatValidation && (
                                                        <div className="text-sm">
                                                            {vatValidation.valid === true && (
                                                                <div className="text-green-600">
                                                                    ✓ Valid VAT ID
                                                                    {vatValidation.name && (
                                                                        <div className="mt-1 text-muted-foreground">
                                                                            Business: {vatValidation.name}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {vatValidation.valid === false && (
                                                                <div className="text-red-600">
                                                                    ✗ Invalid VAT ID: {vatValidation.reason}
                                                                </div>
                                                            )}
                                                            {vatValidation.valid === null && (
                                                                <div className="text-orange-600">
                                                                    ⚠ {vatValidation.reason}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        For European businesses only. Used for VAT validation and potential tax exemption.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}

                                    {step === 3 ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="locationName" className={cn(errors.locationName && "text-destructive")}>
                                                    Location Name
                                                </Label>
                                                <Input
                                                    id="locationName"
                                                    placeholder="e.g. Downtown Branch"
                                                    {...register("locationName")}
                                                    className={cn(errors.locationName && "border-destructive focus-visible:ring-destructive")}
                                                />
                                                <ErrorMessage message={errors.locationName?.message} />
                                            </div>
                                        </div>
                                    ) : null}

                                    {step === 4 ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="listName" className={cn(errors.listName && "text-destructive")}>
                                                Waitlist Name
                                            </Label>
                                            <Input
                                                id="listName"
                                                placeholder="e.g. Dinner List"
                                                {...register("listName")}
                                                className={cn(errors.listName && "border-destructive focus-visible:ring-destructive")}
                                            />
                                            <ErrorMessage message={errors.listName?.message} />
                                        </div>
                                    ) : null}
                                </CardContent>

                                <CardFooter className="flex items-center">
                                    <Button type="submit" className="w-full mt-6" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Continue
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </div>
            )}
        </>
    );
}
