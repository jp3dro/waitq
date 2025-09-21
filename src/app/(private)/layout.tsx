import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-dvh flex flex-col">
      <Nav />
      <div className="flex-1">{children}</div>
    </div>
  );
}


