import { notFound } from "next/navigation";
import ClientStatus from "@/app/w/[token]/status-client";

export default function StatusPage({ params }: { params: { token: string } }) {
  return <ClientStatus token={params.token} />;
}


