export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <main>
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight">Simple, scalable pricing</h1>
            <p className="mt-3 text-neutral-600 dark:text-neutral-400">Start free and upgrade as your foot traffic grows.</p>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white dark:bg-neutral-800 ring-1 ring-black/5 dark:ring-neutral-700 p-6">
              <h2 className="text-lg font-semibold">Starter</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">For small shops just starting.</p>
              <p className="mt-4 text-3xl font-bold">$19<span className="text-base font-normal">/mo</span></p>
              <ul className="mt-6 grid gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <li>• 200 SMS / mo</li>
                <li>• Basic queue</li>
                <li>• Web status page</li>
              </ul>
              <a href="/login" className="mt-6 inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">Get started</a>
            </div>
            <div className="relative rounded-2xl bg-white dark:bg-neutral-800 ring-2 ring-black/10 dark:ring-neutral-600 p-6 shadow-sm">
              <span className="absolute -top-3 right-4 rounded-full bg-black dark:bg-neutral-600 px-2 py-0.5 text-xs font-medium text-white">Popular</span>
              <h2 className="text-lg font-semibold">Pro</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">For busy restaurants.</p>
              <p className="mt-4 text-3xl font-bold">$49<span className="text-base font-normal">/mo</span></p>
              <ul className="mt-6 grid gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <li>• 1,000 SMS / mo</li>
                <li>• Live queue + ETA</li>
                <li>• Priority support</li>
              </ul>
              <a href="/login" className="mt-6 inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">Choose Pro</a>
            </div>
            <div className="rounded-2xl bg-white dark:bg-neutral-800 ring-1 ring-black/5 dark:ring-neutral-700 p-6">
              <h2 className="text-lg font-semibold">Business</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">For chains and franchises.</p>
              <p className="mt-4 text-3xl font-bold">Custom</p>
              <ul className="mt-6 grid gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <li>• Unlimited locations</li>
                <li>• Volume SMS pricing</li>
                <li>• Dedicated onboarding</li>
              </ul>
              <a href="mailto:founder@waitq.example" className="mt-6 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ring-1 ring-inset ring-neutral-300 dark:ring-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800">Contact sales</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


