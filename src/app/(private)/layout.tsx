import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrivateSidebar from "@/components/private-sidebar";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-dvh flex">
      <PrivateSidebar />
      <div className="flex-1 min-w-0 bg-background">{children}</div>
    </div>
  );
}


