// lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const sb = createClient(url, anon, {
  realtime: { params: { eventsPerSecond: 5 } },
});