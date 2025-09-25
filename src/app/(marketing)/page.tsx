export const metadata = { title: "Waitlists for busy venues" };

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-20 pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-serif text-4xl md:text-6xl font-medium tracking-tight">Good first impressions start with new waitlist experiences</h1>
            <p className="mt-4 text-base md:text-lg text-neutral-600">Accept walk-ins, quote accurate times, and keep guests informed. WaitQ helps you move faster and deliver a smoother experience.</p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <a href="/login" className="inline-flex items-center rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-neutral-800">Get started</a>
              <a href="/pricing" className="inline-flex items-center rounded-md px-5 py-2.5 text-sm font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50">See pricing</a>
            </div>
          </div>
        </div>
      </section>

      {/* Accept anywhere */}
      <section className="py-16 border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-2xl">Accept walk‑ins anywhere</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="rounded-xl bg-white ring-1 ring-black/5 p-6">
              <p className="font-medium">Front desk</p>
              <p className="mt-1 text-neutral-600">Add guests in seconds, quote times, and keep the line visible to staff.</p>
            </div>
            <div className="rounded-xl bg-white ring-1 ring-black/5 p-6">
              <p className="font-medium">On the floor</p>
              <p className="mt-1 text-neutral-600">See who’s next from any device. Call, seat, or cancel with one tap.</p>
            </div>
            <div className="rounded-xl bg-white ring-1 ring-black/5 p-6">
              <p className="font-medium">At the door</p>
              <p className="mt-1 text-neutral-600">Show a public display so guests can check their place in line.</p>
            </div>
            <div className="rounded-xl bg-white ring-1 ring-black/5 p-6">
              <p className="font-medium">On the go</p>
              <p className="mt-1 text-neutral-600">Guests get SMS updates and a live status page. No apps needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Devices/checkout-like section */}
      <section className="py-16 border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 grid lg:grid-cols-2 items-center gap-10">
          <div>
            <h2 className="text-2xl">Simplify the flow on any device</h2>
            <ul className="mt-4 space-y-3 text-sm text-neutral-700 list-disc pl-5">
              <li>One-tap actions: call, seat, cancel</li>
              <li>Automatic SMS with your business name</li>
              <li>Live status for guests with a shareable link</li>
              <li>Multi-location support</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white ring-1 ring-black/5 p-10 text-center">
            <div className="mx-auto h-56 w-full max-w-sm rounded-xl bg-neutral-100" />
          </div>
        </div>
      </section>

      {/* Trust/benefits */}
      <section className="py-16 border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-2xl">Peace of mind in every waitlist</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="rounded-xl bg-white ring-1 ring-black/5 p-6"><p className="font-medium">Accurate ETAs</p><p className="mt-1 text-neutral-600">Quote realistic times with historical insights.</p></div>
            <div className="rounded-xl bg-white ring-1 ring-black/5 p-6"><p className="font-medium">Reduce walk‑aways</p><p className="mt-1 text-neutral-600">Keep guests in the loop so they stick around.</p></div>
            <div className="rounded-xl bg-white ring-1 ring-black/5 p-6"><p className="font-medium">Team visibility</p><p className="mt-1 text-neutral-600">Everyone sees who’s next and what’s happening.</p></div>
            <div className="rounded-xl bg-white ring-1 ring-black/5 p-6"><p className="font-medium">No new hardware</p><p className="mt-1 text-neutral-600">Runs on the devices you already have.</p></div>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-16 border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-2xl">Know what you’ll pay</h2>
          <div className="rounded-xl mt-6 bg-white ring-1 ring-black/5 p-6 flex items-center justify-between">
            <div>
              <p className="mt-1 text-sm text-neutral-600">Simple plans that grow with your business.</p>
            </div>
            <a href="/pricing" className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800">See pricing</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-2xl">FAQ</h2>
          <div className="mt-4 divide-y rounded-xl bg-white ring-1 ring-black/5">
            {[
              { q: "How long to get started?", a: "Most teams are up and running in minutes." },
              { q: "Do guests need an app?", a: "No, they receive SMS with a link to a live status page." },
              { q: "Can I use it on multiple devices?", a: "Yes, it works on phones, tablets, and computers." },
              { q: "Can I customize messages?", a: "You can include your business name and ticket number automatically." },
            ].map((item) => (
              <details key={item.q} className="group p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                  {item.q}
                  <span className="ml-2 text-neutral-500 group-open:rotate-180 transition">⌄</span>
                </summary>
                <p className="mt-2 text-sm text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}


