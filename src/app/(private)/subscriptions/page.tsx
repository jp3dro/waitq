export const metadata = { title: "Subscription" };

import Link from "next/link";
import { orderedPlans } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import SubscribeButton from "./subscribe-button";

function formatEUR(amount: number) {
  return amount === 0
    ? "€0"
    : new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(
        amount
      );
}

async function createCheckout(lookupKey: string) {
  "use server";
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/stripe/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lookupKey }),
    // Route handlers can call themselves; rely on full URL to avoid relative issues
  });
  if (!res.ok) return;
  const data = await res.json();
  if (data?.url) {
    // Next.js server action cannot redirect client-side; return URL instead
    return data.url as string;
  }
}

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let current: { plan_id: string | null; status: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("subscriptions")
      .select("plan_id, status")
      .eq("user_id", user.id)
      .maybeSingle();
    current = (data as any) || null;
  }

  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
            <p className="mt-1 text-sm text-neutral-600">Manage your plan and billing</p>
          </div>
        </div>

        {current ? (
          <div className="bg-white ring-1 ring-black/5 rounded-xl p-4">
            <div className="text-sm text-neutral-700">Plano atual: <span className="font-medium">{current.plan_id || "-"}</span> — <span className="capitalize">{current.status || "unknown"}</span></div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {orderedPlans.map((plan) => (
            <div key={plan.id} className="bg-white ring-1 ring-black/5 rounded-xl p-6 flex flex-col">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <div className="mt-2 text-2xl font-bold">
                  {formatEUR(plan.priceMonthlyEUR)} <span className="text-sm font-normal">/ mês</span>
                </div>
              </div>
              <ul className="text-sm text-neutral-700 space-y-1 mb-6">
                <li>{plan.limits.locations} localizações</li>
                <li>{plan.limits.users} utilizadores</li>
                <li>
                  {plan.limits.reservationsPerMonth} reservas/filas por mês
                </li>
                <li>{plan.limits.messagesPerMonth} SMS/e-mails por mês</li>
                {plan.features.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
              {plan.priceMonthlyEUR === 0 ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center w-full rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800"
                >
                  Já incluído
                </Link>
              ) : (
                <SubscribeButton
                  lookupKey={plan.stripe.priceLookupKeyMonthly}
                  planId={plan.id}
                  className="inline-flex items-center justify-center w-full rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800"
                >
                  Subscrever
                </SubscribeButton>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}


