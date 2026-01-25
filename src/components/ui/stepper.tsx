"use client";

import { Minus, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
    value?: number;
    onChange: (value: number | undefined) => void;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
    error?: string | null;
}

export function Stepper({
    value,
    onChange,
    min = 1,
    max = 99,
    step = 1,
    className = "",
    error
}: StepperProps) {
    const isOverMax = value !== undefined && value > max;
    const isUnderMin = value !== undefined && value < min;
    const hasError = !!error || isOverMax || isUnderMin;

    const decrement = () => {
        const newValue = value ? Math.max(min, value - step) : min;
        onChange(newValue);
    };

    const increment = () => {
        const newValue = value ? Math.min(max, value + step) : min;
        onChange(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        if (inputValue === "") {
            onChange(undefined);
            return;
        }
        const numValue = parseInt(inputValue, 10);
        if (!isNaN(numValue) && numValue >= min) {
            // Allow values above max to be entered so we can show error state
            onChange(numValue);
        }
    };

    return (
        <div className={cn("flex flex-col gap-1", className)}>
            <div className="flex items-center">
                <div className={cn(
                    "flex h-9 w-20 items-center rounded-md rounded-r-none border bg-transparent px-3 py-1 text-base md:text-sm shadow-sm transition-colors focus-within:ring-1",
                    hasError
                        ? "border-destructive focus-within:ring-destructive"
                        : "border-input focus-within:ring-ring"
                )}>
                    <User className={cn("mr-2 h-4 w-4 shrink-0", hasError ? "text-destructive" : "text-muted-foreground")} />
                    <input
                        type="number"
                        inputMode="numeric"
                        min={min}
                        value={value || ""}
                        onChange={handleInputChange}
                        className="w-full bg-transparent p-0 placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder={min.toString()}
                    />
                </div>
                <button
                    type="button"
                    onClick={decrement}
                    disabled={value !== undefined && value <= min}
                    className={cn(
                        "inline-flex h-9 w-12 shrink-0 items-center justify-center border border-l-0 bg-transparent text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                        hasError ? "border-destructive" : "border-input"
                    )}
                >
                    <Minus className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={increment}
                    disabled={value !== undefined && value >= max}
                    className={cn(
                        "inline-flex h-9 w-12 shrink-0 items-center justify-center rounded-r-md border border-l-0 bg-transparent text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                        hasError ? "border-destructive" : "border-input"
                    )}
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
            {hasError && (
                <p className="text-sm text-destructive">
                    {error || (isOverMax ? `Maximum ${max} people allowed` : `Minimum ${min} person required`)}
                </p>
            )}
        </div>
    );
}
