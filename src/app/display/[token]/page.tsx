import type { Metadata } from "next";
import DisplayClient from "./status-client";

export const metadata: Metadata = {
  title: "Queue Display",
  description: "Live waitlist display showing current queue status and wait times.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DisplayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <DisplayClient token={token} />;
}


