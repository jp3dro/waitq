"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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

function SignupPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "error" | "info" } | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const router = useRouter();

  const ruleStates = useMemo(() => {
    return passwordRules.map((r) => ({ ...r, ok: r.test(password) }));
  }, [password]);

  const passwordMeetsRequirements = ruleStates.every((r) => r.ok);
  const passwordsMatch = password === confirm;

  const handleGoogleSignup = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
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
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toastManager.add({ title: "Error", description: error.message, type: "error" });
      setMessage({ text: error.message, tone: "error" });
      setLoading(false);
      return;
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setMessage({ text: "Check your email to confirm your account.", tone: "info" });
    setLoading(false);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-card text-card-foreground ring-1 ring-border shadow-sm p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold">Create account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Start using WaitQ</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignup}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-invalid={attemptedSubmit && !email ? true : undefined}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
                <label className="block text-sm font-medium">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
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
                disabled={loading}
                className="w-full flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>
            {message ? (
              <p className={["text-xs text-center", message.tone === "error" ? "text-destructive" : "text-muted-foreground"].join(" ")}>
                {message.text}
              </p>
            ) : null}
            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
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
      <SignupPageContent />
    </Suspense>
  );
}
