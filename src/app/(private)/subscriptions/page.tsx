export const metadata = { title: "Subscription" };

export default function SubscriptionPage() {
  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
            <p className="mt-1 text-sm text-neutral-600">Manage your plan and billing</p>
          </div>
        </div>

        <div className="bg-white ring-1 ring-black/5 rounded-xl p-6">
          <p className="text-sm text-neutral-600">Manage your plan and billing. Coming soon.</p>
        </div>
      </div>
    </main>
  );
}


