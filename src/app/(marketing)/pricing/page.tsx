export default function PricingPage() {
  return (
    <main className="p-8">
      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold">Starter</h2>
          <p className="text-sm text-neutral-600">For small shops just starting.</p>
          <p className="text-3xl font-bold mt-4">$19<span className="text-base font-normal">/mo</span></p>
        </div>
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold">Pro</h2>
          <p className="text-sm text-neutral-600">For busy restaurants.</p>
          <p className="text-3xl font-bold mt-4">$49<span className="text-base font-normal">/mo</span></p>
        </div>
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold">Business</h2>
          <p className="text-sm text-neutral-600">For chains and franchises.</p>
          <p className="text-3xl font-bold mt-4">Custom</p>
        </div>
      </div>
    </main>
  );
}


