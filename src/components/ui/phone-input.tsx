import * as React from "react"
import PhoneInput, { type Country } from "react-phone-number-input"
import "react-phone-number-input/style.css"
import { cn } from "@/lib/utils"

export interface PhoneInputProps
    extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
    value?: string
    onChange?: (value: string) => void
    defaultCountry?: Country
}

const PhoneInputComponent = React.forwardRef<
    HTMLInputElement,
    PhoneInputProps
>(({ className, value, onChange, defaultCountry, ...props }, ref) => {
    return (
        <>
            <PhoneInput
                international
                defaultCountry={defaultCountry}
                value={value}
                onChange={(v) => onChange?.(v || "")}
                className={cn(
                    "flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    "inner-phone-input",
                    className
                )}
                {...props}
            />
            <style jsx global>{`
                .inner-phone-input .PhoneInputInput {
                    background-color: transparent;
                    border: none;
                    outline: none;
                    height: 100%;
                    width: 100%;
                    margin-left: 0.5rem;
                    color: inherit;
                    font-family: inherit;
                    font-size: inherit;
                }
                .inner-phone-input .PhoneInputCountry {
                    display: flex;
                    align-items: center;
                }
                .inner-phone-input .PhoneInputCountrySelect:focus {
                    outline: none;
                }
            `}</style>
        </>
    )
})
PhoneInputComponent.displayName = "PhoneInput"

export { PhoneInputComponent as PhoneInput }
export type { Country }
