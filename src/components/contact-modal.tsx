"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";

type ContactModalProps = {
  children: React.ReactNode;
};

export function ContactModal({ children }: ContactModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to send message");
      }

      setIsSuccess(true);
      setTimeout(() => {
        setOpen(false);
        // Reset state after modal closes
        setTimeout(() => {
          setIsSuccess(false);
        }, 300);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setTimeout(() => {
        setIsSuccess(false);
        setError(null);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Contact us</DialogTitle>
          <DialogDescription>
            Send us a message and we&apos;ll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="p-6 pt-4 flex flex-col items-center justify-center gap-3 min-h-[200px]">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <p className="text-center font-medium">Message sent successfully!</p>
            <p className="text-center text-sm text-muted-foreground">
              We&apos;ll be in touch soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Your name"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="How can we help you?"
                rows={4}
                required
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send message"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
