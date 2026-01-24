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
}

export function Stepper({
    value,
    onChange,
    min = 1,
    max = 99,
    step = 1,
    className = ""
}: StepperProps) {
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
        if (!isNaN(numValue) && numValue >= min && numValue <= max) {
            onChange(numValue);
        }
    };

    return (
        <div className={cn("flex items-center", className)}>
            <div className="flex h-9 w-20 items-center rounded-md rounded-r-none border border-input bg-transparent px-3 py-1 text-base md:text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring">
                <User className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                <input
                    type="number"
                    inputMode="numeric"
                    min={min}
                    max={max}
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
                className="inline-flex h-9 w-12 shrink-0 items-center justify-center border border-l-0 border-input bg-transparent text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            >
                <Minus className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={increment}
                disabled={value !== undefined && value >= max}
                className="inline-flex h-9 w-12 shrink-0 items-center justify-center rounded-r-md border border-l-0 border-input bg-transparent text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    );
}
