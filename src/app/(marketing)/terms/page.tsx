import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the WaitQ Terms of Service and Privacy Policy. Learn about your rights and responsibilities when using our restaurant waitlist management software.",
  openGraph: {
    title: "Terms of Service - WaitQ",
    description: "Read the WaitQ Terms of Service and Privacy Policy.",
  },
};

export default function TermsPage() {
  return (
    <main className="py-16">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight">Terms and Conditions</h1>
          <p className="mt-4 text-sm text-muted-foreground">These terms are a placeholder and will be updated.</p>
        </div>
        <div className="mx-auto mt-6 max-w-3xl prose prose-slate dark:prose-invert">
          <p>By using WaitQ, you agree to our standard terms of service and privacy practices.</p>
          <p>Contact us for any questions.</p>
        </div>
      </div>
    </main>
  );
}


