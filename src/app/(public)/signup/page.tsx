import type { Metadata } from "next";
import SignupPage from "./signup-client";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a free WaitQ account and start managing your restaurant waitlist in minutes. No credit card required.",
  openGraph: {
    title: "Create Account - WaitQ",
    description: "Create a free WaitQ account and start managing your restaurant waitlist in minutes.",
  },
};

export default function Page() {
  return <SignupPage />;
}
