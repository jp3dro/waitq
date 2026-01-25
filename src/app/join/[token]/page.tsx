import type { Metadata } from "next";
import JoinPage from "./join-client";

export const metadata: Metadata = {
  title: "Join Waitlist",
  description: "Join the waitlist and get notified when your table is ready.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page({ params }: { params: Promise<{ token: string }> }) {
  return <JoinPage params={params} />;
}
