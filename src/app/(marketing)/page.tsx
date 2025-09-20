export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-20 pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Run waitlists without the chaos
            </h1>
            <p className="mt-4 text-base md:text-lg text-neutral-600">
              WaitQ organizes your queue, sends SMS updates automatically, and helps you seat more guests with fewer no‑shows.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <a href="/login" className="inline-flex items-center rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-neutral-800">Get started free</a>
              <a href="/pricing" className="inline-flex items-center rounded-md px-5 py-2.5 text-sm font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50">See pricing</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl bg-white ring-1 ring-black/5 p-6">
              <h3 className="text-base font-semibold">SMS notifications</h3>
              <p className="mt-1 text-sm text-neutral-600">Automatically message guests when their table is ready. Reduce walk‑aways and no‑shows.</p>
            </div>
            <div className="rounded-xl bg-white ring-1 ring-black/5 p-6">
              <h3 className="text-base font-semibold">Live queue</h3>
              <p className="mt-1 text-sm text-neutral-600">Staff see the queue update in real time. Guests can check status on their phone.</p>
            </div>
            <div className="rounded-xl bg-white ring-1 ring-black/5 p-6">
              <h3 className="text-base font-semibold">Simple setup</h3>
              <p className="mt-1 text-sm text-neutral-600">Start in minutes. Works with your existing devices—no new hardware needed.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


