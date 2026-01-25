import type { Metadata } from "next";
import ResetPasswordPage from "./reset-password-client";

export const metadata: Metadata = {
  title: "Set New Password",
  description: "Set a new password for your WaitQ account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <ResetPasswordPage />;
}
