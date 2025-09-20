"use client";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  async function handleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-6">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-neutral-600">Use your Google account to continue.</p>
          <button
            onClick={handleLogin}
            className="mt-6 w-full inline-flex items-center justify-center rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}


