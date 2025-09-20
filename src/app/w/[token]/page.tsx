import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function StatusPage({ params }: { params: { token: string } }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("waitlist_entries")
    .select("status, created_at, eta_minutes, position")
    .eq("token", params.token)
    .single();
  if (!data) notFound();
  return (
    <main className="p-8 max-w-xl mx-auto space-y-2">
      <h1 className="text-2xl font-semibold">Your place in line</h1>
      <p>Status: {data.status}</p>
      {data.eta_minutes ? <p>ETA: {data.eta_minutes} min</p> : null}
      {typeof data.position === "number" ? <p>Position: {data.position}</p> : null}
      <p className="text-sm text-neutral-600">Updated automatically when the venue advances the queue.</p>
    </main>
  );
}


