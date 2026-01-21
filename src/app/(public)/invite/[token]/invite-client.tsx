"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toastManager } from "@/hooks/use-toast";
import { Eye, EyeOff, Check, X } from "lucide-react";

export default function InviteClient({ businessName, email, token }: { businessName: string; email: string; token: string }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [reqs, setReqs] = useState({
    length: false,
    upper: false,
    lower: false,
    digit: false,
    symbol: false,
  });
  const router = useRouter();

  useEffect(() => {
    setReqs({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      digit: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const isValid = Object.values(reqs).every(Boolean);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);

    const supabase = createClient();
    
    // Attempt sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
           invite_token: token
        }
      }
    });

    if (error) {
       // If user already exists, maybe try sign in? 
       // Or user should be redirected to login.
       if (error.message.includes("already registered")) {
           toastManager.add({
               title: "Account exists",
               description: "Please log in to accept the invite.",
               type: "info"
           });
           // Redirect to login with next param? Or handle login here?
           // Ideally we redirect to login page
           router.push(`/login?email=${encodeURIComponent(email)}&invite_token=${token}`);
           return;
       }
       toastManager.add({ title: "Error", description: error.message, type: "error" });
       setLoading(false);
    } else {
        // Success?
        // Need to link membership. 
        // We can do this via a server action or an API call after signup.
        // But since email verification might be required, the auth/callback handles it usually.
        // If email verification is disabled or auto-confirmed:
        // We can call an API to accept invite.
        await acceptInvite(token);
    }
  };

  async function acceptInvite(t: string) {
      const res = await fetch("/api/invite/accept", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: t })
      });
      if (res.ok) {
          toastManager.add({ title: "Welcome!", description: `You have joined ${businessName}`, type: "success" });
          router.push("/lists");
      } else {
          const j = await res.json();
          toastManager.add({ title: "Error", description: j.error || "Failed to join", type: "error" });
          setLoading(false);
      }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">You're invited!</h2>
        <p className="mt-2 text-muted-foreground">
          You have been invited to join <strong>{businessName}</strong>.
        </p>
      </div>

      <div className="bg-card text-card-foreground p-8 shadow-sm ring-1 ring-border rounded-xl">
        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="mt-1 block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm opacity-75 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Create Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <div className={`flex items-center gap-2 ${reqs.length ? "text-green-600" : ""}`}>
                {reqs.length ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                At least 8 characters
              </div>
              <div className={`flex items-center gap-2 ${reqs.upper ? "text-green-600" : ""}`}>
                {reqs.upper ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                Uppercase letter
              </div>
              <div className={`flex items-center gap-2 ${reqs.lower ? "text-green-600" : ""}`}>
                {reqs.lower ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                Lowercase letter
              </div>
              <div className={`flex items-center gap-2 ${reqs.digit ? "text-green-600" : ""}`}>
                {reqs.digit ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                Number
              </div>
              <div className={`flex items-center gap-2 ${reqs.symbol ? "text-green-600" : ""}`}>
                {reqs.symbol ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                Symbol
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create Account & Join"}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <a href={`/login?email=${encodeURIComponent(email)}&invite_token=${token}`} className="font-medium text-primary hover:underline">Log in</a>
        </div>
      </div>
    </div>
  );
}

