"use client";

import { Button } from "@/components/ui/button";
import { ContactModal } from "@/components/contact-modal";

type ContactButtonProps = {
  variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
  className?: string;
  children?: React.ReactNode;
};

export function ContactButton({ 
  variant = "outline", 
  size = "lg", 
  className,
  children = "Contact"
}: ContactButtonProps) {
  return (
    <ContactModal>
      <Button variant={variant} size={size} className={className}>
        {children}
      </Button>
    </ContactModal>
  );
}
