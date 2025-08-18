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


export function sbAdmin() {
  const { url, serviceKey } = requireEnv();
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}


export default sbAdmin;