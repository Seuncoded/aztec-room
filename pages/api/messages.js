// pages/api/messages.js
import { sbAdmin } from "../../lib/supabaseAdmin.js"; 

const TABLE = "messages";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = sbAdmin();

  try {
    if (req.method === "GET") {
      const room = String(req.query.room || "").trim().toLowerCase();
      const limit = Math.min(parseInt(req.query.limit || "80", 10) || 80, 200);
      if (!room) return res.status(400).json({ error: "room required" });

      const { data, error } = await supabase
        .from(TABLE)
        .select("id, room, handle, text, pfp_url, created_at")
        .eq("room", room)
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
      const pfp_url = body.pfp_url ? String(body.pfp_url).trim() : null;

      if (!room) return res.status(400).json({ error: "room required" });
      if (!text) return res.status(400).json({ error: "text required" });

      const cleanText = text.slice(0, 2000);
      const cleanHandle = handle.slice(0, 40) || null;
      const cleanPfp = pfp_url ? pfp_url.slice(0, 1000) : null;

      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          room,
          text: cleanText,
          handle: cleanHandle,
          pfp_url: cleanPfp,
        })
        .select("id, room, handle, text, pfp_url, created_at")
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