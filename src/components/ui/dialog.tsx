"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"

const DialogVariantContext = React.createContext<{ isMobile: boolean } | null>(null)

function useDialogVariant() {
    const ctx = React.useContext(DialogVariantContext)
    return ctx ?? { isMobile: false }
}

function Dialog({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
    const isMobile = useIsMobile()
    if (isMobile) {
        return (
            <DialogVariantContext.Provider value={{ isMobile }}>
                <Drawer data-slot="dialog" direction="bottom" {...(props as any)} />
            </DialogVariantContext.Provider>
        )
    }
    return (
        <DialogVariantContext.Provider value={{ isMobile }}>
            <DialogPrimitive.Root data-slot="dialog" {...props} />
        </DialogVariantContext.Provider>
    )
}

function DialogTrigger({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
    const { isMobile } = useDialogVariant()
    if (isMobile) {
        return <DrawerTrigger data-slot="dialog-trigger" {...(props as any)} />
    }
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
    // No-op on mobile drawer; kept for API parity.
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
    const { isMobile } = useDialogVariant()
    if (isMobile) {
        return <DrawerClose data-slot="dialog-close" {...(props as any)} />
    }
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    // Drawer provides its own overlay; keep this for desktop only.
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50", className)}
            {...props}
        />
    )
}

function DialogContent({
    className,
    children,
    showCloseButton = true,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean
}) {
    const { isMobile } = useDialogVariant()
    if (isMobile) {
        return (
            <DrawerContent
                data-slot="dialog-content"
                className={cn("gap-4 px-6 pb-6 pt-2", className)}
                {...(props as any)}
            >
                {/* Close button (top-right) */}
                {showCloseButton && (
                    <DrawerClose asChild>
                        <Button variant="ghost" className="absolute top-4 right-4" size="icon-sm">
                            <XIcon />
                            <span className="sr-only">Close</span>
                        </Button>
                    </DrawerClose>
                )}
                {children}
            </DrawerContent>
        )
    }
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={cn(
                    "bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid gap-4 max-w-[calc(100%-2rem)] rounded-xl p-6 text-sm ring-1 duration-100 sm:max-w-md fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
                    className
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogPrimitive.Close data-slot="dialog-close" asChild>
                        <Button variant="ghost" className="absolute top-4 right-4" size="icon-sm">
                            <XIcon
                            />
                            <span className="sr-only">Close</span>
                        </Button>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
    const { isMobile } = useDialogVariant()
    if (isMobile) {
        return (
            <DrawerHeader
                data-slot="dialog-header"
                className={cn("p-0 flex flex-col gap-1.5 text-center sm:text-left", className)}
                {...(props as any)}
            />
        )
    }
    return (
        <div
            data-slot="dialog-header"
            className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)}
            {...props}
        />
    )
}

function DialogFooter({
    className,
    showCloseButton = false,
    children,
    ...props
}: React.ComponentProps<"div"> & {
    showCloseButton?: boolean
}) {
    const { isMobile } = useDialogVariant()
    if (isMobile) {
        return (
            <DrawerFooter
                data-slot="dialog-footer"
                className={cn(
                    // Mobile convention: primary first, cancel last (stacked).
                    "gap-2 p-0 mt-0 flex flex-col",
                    className
                )}
                {...(props as any)}
            >
                {children}
            </DrawerFooter>
        )
    }
    return (
        <div
            data-slot="dialog-footer"
            className={cn(
                // Convention: put primary actions first and Cancel last.
                // We push the last child to the right on larger screens.
                "flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 sm:[&>*:last-child:not(:first-child)]:ml-auto",
                className
            )}
            {...props}
        >
            {showCloseButton && (
                <DialogPrimitive.Close asChild>
                    <Button variant="outline">Close</Button>
                </DialogPrimitive.Close>
            )}
            {children}
        </div>
    )
}

function DialogTitle({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
    const { isMobile } = useDialogVariant()
    if (isMobile) {
        return (
            <DrawerTitle
                data-slot="dialog-title"
                className={cn("text-lg font-semibold leading-none tracking-tight", className)}
                {...(props as any)}
            />
        )
    }
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn("text-lg font-semibold leading-none tracking-tight", className)}
            {...props}
        />
    )
}

function DialogDescription({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
    const { isMobile } = useDialogVariant()
    if (isMobile) {
        return (
            <DrawerDescription
                data-slot="dialog-description"
                className={cn("text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3", className)}
                {...(props as any)}
            />
        )
    }
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn("text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3", className)}
            {...props}
        />
    )
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
}
