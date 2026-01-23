import { getAdminClient } from "@/lib/supabase/admin";

export type ResolvedBusinessContext = {
  businessId: string;
  role: string | null;
  canEdit: boolean;
};

type SupabaseLike = {
  from: (table: string) => any;
};

export async function resolveCurrentBusinessId(
  supabase: SupabaseLike,
  userId: string
): Promise<string | null> {
  // Use admin client to bypass RLS for infrastructure operations
  // This ensures invited users can access their organization's data
  const admin = getAdminClient();
  
  // Prefer owned business.
  const { data: owned } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const ownedId = (owned?.id as string | undefined) ?? null;
  if (ownedId) return ownedId;

  // Else: first active membership business.
  const { data: member } = await admin
    .from("memberships")
    .select("business_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (member?.business_id as string | undefined) ?? null;
}

export async function resolveCurrentBusinessContext(
  supabase: SupabaseLike,
  userId: string
): Promise<ResolvedBusinessContext | null> {
  // Use admin client to bypass RLS for infrastructure operations
  // This ensures invited users can access their organization's data
  const admin = getAdminClient();
  
  // Prefer owned business.
  const { data: owned } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const ownedId = (owned?.id as string | undefined) ?? null;
  if (ownedId) return { businessId: ownedId, role: "owner", canEdit: true };

  // Else: first active membership business.
  const { data: member } = await admin
    .from("memberships")
    .select("business_id, role")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const businessId = (member?.business_id as string | undefined) ?? null;
  if (!businessId) return null;

  const role = (member?.role as string | undefined) ?? null;
  const canEdit = role === "admin";
  return { businessId, role, canEdit };
}

