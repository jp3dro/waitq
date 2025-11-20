"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, footer }: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-card text-card-foreground shadow-xl ring-1 ring-border">
          <div className="flex items-center justify-between px-4 h-12 border-b border-border">
            <h3 className="text-base font-semibold">{title}</h3>
            <button onClick={onClose} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 bg-card text-card-background">
            {children}
          </div>
          {footer && (
            <div className="flex items-center justify-between flex-row-reverse px-4 h-12 border-t border-border">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


