"use client";
import { useEffect } from "react";

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
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-card text-card-foreground shadow-xl ring-1 ring-border">
          <div className="flex items-center justify-between px-4 h-12 border-b border-border">
            <h3 className="text-base font-semibold">{title}</h3>
            <button onClick={onClose} className="text-muted-foreground hover:opacity-90">✕</button>
          </div>
          <div className="p-4">
            {children}
          </div>
          {footer && (
            <div className="flex items-center justify-end gap-3 px-4 h-12 border-t border-border">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


