import ClientStatus from "@/app/w/[token]/status-client";

export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div>
      <ClientStatus token={token} />
    </div>
  );
}


