// pages/api/messages.js
import getSupabaseAdmin from "../../lib/supabaseAdmin";

const TABLE = "messages";

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const supabase = getSupabaseAdmin(); 

    if (req.method === "GET") {
      const room = String(req.query.room || "").trim().toLowerCase();
      const limit = Math.min(parseInt(req.query.limit || "80", 10) || 80, 200);
      if (!room) return res.status(400).json({ error: "room required" });


const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const { data, error } = await supabase
  .from(TABLE)
  .select("id, room, handle, text, pfp_url, created_at")
  .eq("room", room)
  .gt("created_at", since)        
  .order("created_at", { ascending: true })
  .limit(limit);

      if (error) throw error;
      return res.status(200).json({ ok: true, items: data || [] });
    }

    if (req.method === "POST") {
      
      const body =
        typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

      const room = String(body.room || "").trim().toLowerCase();
      const text = String(body.text || "").trim();
      const handle = String(body.handle || "").trim();

      if (!room) return res.status(400).json({ error: "room required" });
      if (!text) return res.status(400).json({ error: "text required" });

      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          room,
          text: text.slice(0, 2000),
          handle: handle.slice(0, 40) || null,
        })
        .select("id, room, handle, text, created_at")
        .single();

      if (error) throw error;
      return res.status(201).json({ ok: true, item: data });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("messages API error:", e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}