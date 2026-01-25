import type { Metadata } from "next";
import ClientStatus from "@/app/w/[token]/status-client";

export const metadata: Metadata = {
  title: "Your Waitlist Status",
  description: "Check your position in the waitlist and estimated wait time.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div>
      <ClientStatus token={token} />
    </div>
  );
}


