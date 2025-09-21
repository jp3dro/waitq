import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <div className="bg-white ring-1 ring-black/5 rounded-xl p-6">
      <h2 className="text-base font-semibold">Profile</h2>
      <div className="mt-4 grid gap-3 text-sm">
        <div>
          <div className="text-neutral-600">Email</div>
          <div className="font-medium">{user?.email}</div>
        </div>
        <div>
          <div className="text-neutral-600">User ID</div>
          <div className="font-mono text-xs">{user?.id}</div>
        </div>
      </div>
    </div>
  );
}


