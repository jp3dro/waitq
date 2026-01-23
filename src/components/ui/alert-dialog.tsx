"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { XIcon } from "lucide-react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer"

const AlertDialogVariantContext = React.createContext<{ isMobile: boolean } | null>(null)

function useAlertDialogVariant() {
  const ctx = React.useContext(AlertDialogVariantContext)
  return ctx ?? { isMobile: false }
}

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return (
      <AlertDialogVariantContext.Provider value={{ isMobile }}>
        <Drawer data-slot="alert-dialog" direction="bottom" {...(props as any)} />
      </AlertDialogVariantContext.Provider>
    )
  }
  return (
    <AlertDialogVariantContext.Provider value={{ isMobile }}>
      <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
    </AlertDialogVariantContext.Provider>
  )
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  const { isMobile } = useAlertDialogVariant()
  if (isMobile) {
    return <DrawerTrigger data-slot="alert-dialog-trigger" {...(props as any)} />
  }
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  // Drawer provides its own overlay; keep this for desktop only.
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 z-50", className)}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  size?: "default" | "sm"
}) {
  const { isMobile } = useAlertDialogVariant()
  if (isMobile) {
    return (
      <DrawerContent
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn("gap-4 px-6 pb-6 pt-2", className)}
        {...(props as any)}
      >
        <DrawerClose asChild>
          <Button variant="ghost" className="absolute top-4 right-4" size="icon-sm" aria-label="Close">
            <XIcon />
          </Button>
        </DrawerClose>
        {children}
      </DrawerContent>
    )
  }
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(
          "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 bg-background ring-foreground/10 gap-6 rounded-xl p-6 ring-1 duration-100 data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-lg group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 outline-none",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile } = useAlertDialogVariant()
  if (isMobile) {
    return (
      <DrawerHeader
        data-slot="alert-dialog-header"
        className={cn(
          "p-0",
          "grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
          className
        )}
        {...(props as any)}
      />
    )
  }
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile } = useAlertDialogVariant()
  if (isMobile) {
    return (
      <DrawerFooter
        data-slot="alert-dialog-footer"
        className={cn("gap-2 p-0 mt-0 flex flex-col", className)}
        {...(props as any)}
      />
    )
  }
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        // Convention: put primary actions first and Cancel last.
        // We push the last child to the right on larger screens.
        "flex flex-col gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:items-center sm:[&>*:last-child:not(:first-child)]:ml-auto",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn("bg-muted mb-2 inline-flex size-16 items-center justify-center rounded-md sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-8", className)}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  const { isMobile } = useAlertDialogVariant()
  if (isMobile) {
    return (
      <DrawerTitle
        data-slot="alert-dialog-title"
        className={cn("text-xl font-bold leading-none tracking-tight sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2", className)}
        {...(props as any)}
      />
    )
  }
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-xl font-bold leading-none tracking-tight sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  const { isMobile } = useAlertDialogVariant()
  if (isMobile) {
    return (
      <DrawerDescription
        data-slot="alert-dialog-description"
        className={cn("text-muted-foreground *:[a]:hover:text-foreground text-sm text-balance md:text-pretty *:[a]:underline *:[a]:underline-offset-3", className)}
        {...(props as any)}
      />
    )
  }
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground *:[a]:hover:text-foreground text-sm text-balance md:text-pretty *:[a]:underline *:[a]:underline-offset-3", className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  const { isMobile } = useAlertDialogVariant()
  if (isMobile) {
    return (
      <DrawerClose asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("w-full", className)}
          {...(props as any)}
        />
      </DrawerClose>
    )
  }
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Action
        data-slot="alert-dialog-action"
        className={cn(className)}
        {...props}
      />
    </Button>
  )
}

function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  const { isMobile } = useAlertDialogVariant()
  if (isMobile) {
    return (
      <DrawerClose asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("w-full", className)}
          {...(props as any)}
        />
      </DrawerClose>
    )
  }
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Cancel
        data-slot="alert-dialog-cancel"
        className={cn(className)}
        {...props}
      />
    </Button>
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
