import { createClient } from "@supabase/supabase-js";

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin client missing URL or SERVICE_ROLE key");
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}


