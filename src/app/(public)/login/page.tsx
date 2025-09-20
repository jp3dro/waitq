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
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm w-full space-y-4">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <button
          onClick={handleLogin}
          className="w-full h-10 rounded-md bg-black text-white hover:bg-neutral-800"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}


