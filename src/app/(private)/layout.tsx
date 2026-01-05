import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrivateSidebar from "@/components/private-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from('profiles').select('onboarding_completed').eq('id', user.id).single();
  if (!profile || !profile.onboarding_completed) {
    redirect("/onboarding");
  }
  return (
    <SidebarProvider defaultOpen>
      <PrivateSidebar />
      <SidebarInset className="min-h-dvh bg-background">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}


