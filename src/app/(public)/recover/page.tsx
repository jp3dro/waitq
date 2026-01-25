import type { Metadata } from "next";
import RecoverPasswordPage from "./recover-client";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your WaitQ account password. We'll send you a link to set a new password.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <RecoverPasswordPage />;
}
