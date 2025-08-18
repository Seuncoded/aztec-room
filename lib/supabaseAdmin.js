// lib/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";

function requireEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use the service role key for server-side API routes.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return { url, serviceKey };
}

/** Factory: returns a new admin client (use inside API handlers) */
export function sbAdmin() {
  const { url, serviceKey } = requireEnv();
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

/** Convenience: a ready admin client (for simple uses) */
export const supabase = sbAdmin();

/** Default export for legacy imports */
export default supabase;