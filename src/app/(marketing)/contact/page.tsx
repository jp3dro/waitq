export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <main className="py-16">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Reach us at{" "}
            <a className="underline underline-offset-4 hover:text-foreground" href="mailto:hello@waitq.app">
              hello@waitq.app
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}


