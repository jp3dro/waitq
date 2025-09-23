import ClientStatus from "@/app/w/[token]/status-client";

export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div>
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 h-14 flex items-center justify-center">
          {/* Business name/logo rendered client-side after fetch via status-client */}
          <span className="font-semibold text-lg tracking-tight text-neutral-900">Your place in line</span>
        </div>
      </header>
      <ClientStatus token={token} />
    </div>
  );
}


