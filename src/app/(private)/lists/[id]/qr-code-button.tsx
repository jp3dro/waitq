"use client";
import { useState } from "react";
import { QrCode } from "lucide-react";
import QRCodeModal from "../qr-code-modal";

export default function QRCodeButton({ listName, displayToken, businessName }: { listName: string; displayToken?: string | null; businessName?: string }) {
  const [open, setOpen] = useState(false);
  if (!displayToken) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="action-btn"
        aria-label="Open QR code"
        title="Open QR code"
      >
        <QrCode className="h-4 w-4" />
      </button>
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


