import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Request-memoized auth helpers.
 *
 * Why: Multiple `supabase.auth.getUser()` calls in a single request can trigger
 * token refresh/rotation more than once. In Server Components we can't persist
 * refreshed cookies, which can lead to intermittent "signed out on refresh".
 */

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
});

