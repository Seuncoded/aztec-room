// pages/api/rooms.js
import { sbAdmin } from "../../lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });
  try {
    const { data, error } = await sbAdmin()
      .from("rooms")
      .select("id, name, is_adult, created_at")
      .order("name", { ascending: true });
    if (error) throw error;
    res.status(200).json({ items: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
}