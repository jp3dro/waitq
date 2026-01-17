"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && email.includes("@") && !loading;
  }, [email, loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setSubmitted(false);
    try {
      await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      // Always show generic message regardless of server response to avoid account enumeration.
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-card text-card-foreground ring-1 ring-border shadow-sm p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold">Reset your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">We’ll send you a link to set a new password.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>

            {submitted ? (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                <AlertTitle className="text-sm">Check your inbox</AlertTitle>
                <AlertDescription className="text-emerald-900/90 dark:text-emerald-200/90">
                  If this email is used by an account, you will receive a reset password email. Please check your Spam folder as well.
                </AlertDescription>
              </Alert>
            ) : null}

            <p className="text-xs text-center text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

