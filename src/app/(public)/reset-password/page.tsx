"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toastManager } from "@/hooks/use-toast";

type PasswordRule = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

const passwordRules: PasswordRule[] = [
  { id: "len", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "lower", label: "At least 1 lowercase letter (a-z)", test: (p) => /[a-z]/.test(p) },
  { id: "upper", label: "At least 1 uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "number", label: "At least 1 number (0-9)", test: (p) => /\d/.test(p) },
  { id: "special", label: "At least 1 special character (e.g. !@#$)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function ResetPasswordContent() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "error" | "info" } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(({ data }) => setHasSession(!!data.session))
      .catch(() => setHasSession(false));
  }, []);

  const ruleStates = useMemo(() => {
    return passwordRules.map((r) => ({ ...r, ok: r.test(password) }));
  }, [password]);

  const passwordMeetsRequirements = ruleStates.every((r) => r.ok);
  const passwordsMatch = password === confirm;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttemptedSubmit(true);
    setMessage(null);

    if (!passwordMeetsRequirements) {
      setMessage({ text: "Please update your password to meet all requirements.", tone: "error" });
      return;
    }
    if (!passwordsMatch) {
      setMessage({ text: "Passwords do not match.", tone: "error" });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage({ text: error.message, tone: "error" });
        toastManager.add({ title: "Error", description: error.message, type: "error" });
        return;
      }
      toastManager.add({
        title: "Password updated",
        description: "You’re now signed in.",
        type: "success",
      });
      router.replace("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-card text-card-foreground ring-1 ring-border shadow-sm p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account.</p>
          </div>

          {hasSession === false ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This reset link is invalid or expired. Please request a new one.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/recover"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Request new link
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  aria-invalid={attemptedSubmit && !passwordMeetsRequirements ? true : undefined}
                  className={[
                    "mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-primary focus:outline-none",
                    attemptedSubmit && !passwordMeetsRequirements ? "border-destructive focus:ring-destructive" : "border-input",
                  ].join(" ")}
                />
                <div className="mt-2 rounded-md border border-border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-foreground">Password requirements</p>
                  <ul className="mt-2 space-y-1">
                    {ruleStates.map((r) => (
                      <li
                        key={r.id}
                        className={[
                          "text-xs",
                          r.ok ? "text-emerald-600 dark:text-emerald-500" : "text-muted-foreground",
                        ].join(" ")}
                      >
                        {r.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Confirm new password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  aria-invalid={attemptedSubmit && !passwordsMatch ? true : undefined}
                  className={[
                    "mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-primary focus:outline-none",
                    attemptedSubmit && !passwordsMatch ? "border-destructive focus:ring-destructive" : "border-input",
                  ].join(" ")}
                />
                {attemptedSubmit && !passwordsMatch ? (
                  <p className="mt-1 text-xs text-destructive">Passwords do not match.</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={loading || hasSession !== true}
                className="w-full flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {loading ? "Updating…" : "Update password"}
              </button>

              {message ? (
                <p className={["text-xs text-center", message.tone === "error" ? "text-destructive" : "text-muted-foreground"].join(" ")}>
                  {message.text}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center p-6 bg-background text-foreground">
          <div className="w-full max-w-sm">
            <div className="rounded-2xl bg-card text-card-foreground ring-1 ring-border shadow-sm p-6 space-y-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

