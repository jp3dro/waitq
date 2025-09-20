export default function HomePage() {
  return (
    <main className="p-8">
      <section className="max-w-3xl mx-auto text-center space-y-4">
        <h1 className="text-4xl font-bold">Manage your waiting list with ease</h1>
        <p className="text-neutral-600">
          WaitQ helps restaurants and local businesses organize waiting queues, notify customers by SMS, and reduce no-shows.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/login" className="bg-black text-white px-4 py-2 rounded-md">Get started</a>
          <a href="/pricing" className="px-4 py-2 rounded-md border">See pricing</a>
        </div>
      </section>
    </main>
  );
}


