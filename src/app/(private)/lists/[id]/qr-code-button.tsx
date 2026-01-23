"use client";
import { useState } from "react";
import { QrCode } from "lucide-react";
import QRCodeModal from "../qr-code-modal";
import { Button } from "@/components/ui/button";

export default function QRCodeButton({
  listName,
  displayToken,
  businessName,
  variant = "icon",
  className,
}: {
  listName: string;
  displayToken?: string | null;
  businessName?: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!displayToken) return null;
  return (
    <>
      {variant === "button" ? (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          variant="outline"
          size="sm"
          className={className}
        >
          <QrCode className="h-4 w-4" />
          QR code
        </Button>
      ) : (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          variant="outline"
          size="icon-sm"
          aria-label="Open QR code"
          title="Open QR code"
          className={className}
        >
          <QrCode className="h-4 w-4" />
        </Button>
      )}
      <QRCodeModal
        open={open}
        onClose={() => setOpen(false)}
        listName={listName}
        displayToken={displayToken || undefined}
        businessName={businessName}
      />
    </>
  );
}


