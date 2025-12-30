"use client";

import { Minus, Plus } from "lucide-react";

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
    <div className={`flex items-center ${className}`}>
      <button
        type="button"
        onClick={decrement}
        disabled={value !== undefined && value <= min}
        className="inline-flex items-center justify-center h-10 w-10 rounded-l-md border border-border bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Minus className="h-4 w-4" />
      </button>

      <input
        type="number"
        min={min}
        max={max}
        value={value || ""}
        onChange={handleInputChange}
        className="w-16 h-10 text-center border-y border-border px-2 text-sm focus:ring-2 focus:ring-ring"
        placeholder="—"
      />

      <button
        type="button"
        onClick={increment}
        disabled={value !== undefined && value >= max}
        className="inline-flex items-center justify-center h-10 w-10 rounded-r-md border border-border bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
