// lib/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";

function requireEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return { url, serviceKey };
}

/**
 * Factory: returns a fresh admin Supabase client per request.
 * Use this in API routes:  const supabase = sbAdmin();
 */
export function sbAdmin() {
  const { url, serviceKey } = requireEnv();
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// Make the DEFAULT export the *function* too (so default import is callable)
export default sbAdmin;