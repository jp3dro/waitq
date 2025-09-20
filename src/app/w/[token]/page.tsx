import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function StatusPage({ params }: { params: { token: string } }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("waitlist_entries")
    .select("status, created_at, eta_minutes, queue_position")
    .eq("token", params.token)
    .single();
  if (!data) notFound();
  return (
    <main className="p-8">
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-6">
          <h1 className="text-xl font-semibold">Your place in line</h1>
          <div className="mt-4 grid gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">Status</span>
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">{data.status}</span>
            </div>
            {data.eta_minutes ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">ETA</span>
                <span className="text-sm font-medium">{data.eta_minutes} min</span>
              </div>
            ) : null}
            {typeof (data as any).queue_position === "number" ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Position</span>
                <span className="text-sm font-medium">{(data as any).queue_position}</span>
              </div>
            ) : null}
          </div>
          <p className="mt-6 text-sm text-neutral-600">This page updates automatically as the venue advances the queue.</p>
        </div>
      </div>
    </main>
  );
}


