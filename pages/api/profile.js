// pages/api/messages.js
import { sbAdmin } from "../../lib/supabaseAdmin";

const TABLE = "messages"; 

export default async function handler(req, res) {
  const supabase = sbAdmin();

  if (req.method === "GET") {
    try {
      const room = String(req.query.room || "general").toLowerCase();
      const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);

      const { data, error } = await supabase
        .from(TABLE)
        .select("id, room, handle, text, pfp_url, created_at")
        .eq("room", room)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return res.status(200).json(data || []);
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "GET failed" });
    }
  }

  if (req.method === "POST") {
    try {
      const { room, text, handle, pfp_url } = req.body || {};

      const cleanRoom = String(room || "general").toLowerCase().trim();
      const cleanText = String(text || "").trim();
      const cleanHandle = String(handle || "").trim().slice(0, 48);
      const cleanPfp = (pfp_url ? String(pfp_url) : "").trim().slice(0, 512);

      if (!cleanText) return res.status(400).json({ ok: false, error: "Empty message" });
      if (!cleanHandle) return res.status(400).json({ ok: false, error: "Missing handle" });

      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          room: cleanRoom,
          handle: cleanHandle,
          text: cleanText.slice(0, 2000),
          pfp_url: cleanPfp || null,
        })
        .select("id, room, handle, text, pfp_url, created_at")
        .single();

      if (error) throw error;
      return res.status(200).json({ ok: true, message: data });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "POST failed" });
    }
  }

  res.setHeader("Allow", "GET,POST");
  return res.status(405).end("Method Not Allowed");
}