import type { Metadata } from "next";
import LoginPage from "./login-client";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your WaitQ account to manage your restaurant waitlist and queue.",
  openGraph: {
    title: "Sign In - WaitQ",
    description: "Sign in to your WaitQ account to manage your restaurant waitlist.",
  },
};

export default function Page() {
  return <LoginPage />;
}
