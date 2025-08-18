// pages/api/typing.js

const TYPING_TTL_MS = 5000; 
const store = global._typingStore || new Map();
if (!global._typingStore) global._typingStore = store;

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "POST") {
      const { room, handle } =
        typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      if (!room || !handle) return res.status(400).json({ error: "room & handle required" });

      const key = room.toLowerCase();
      const list = store.get(key) || new Map();
      list.set(handle, Date.now());
      store.set(key, list);
      return res.status(204).end();
    }

    if (req.method === "GET") {
      const room = String(req.query.room || "").toLowerCase();
      if (!room) return res.status(400).json({ error: "room required" });

      const now = Date.now();
      const list = store.get(room) || new Map();
      const active = [];
      for (const [h, ts] of list.entries()) {
        if (now - ts <= TYPING_TTL_MS) active.push(h);
      }
     
      for (const [h, ts] of list.entries()) {
        if (now - ts > TYPING_TTL_MS) list.delete(h);
      }
      if (list.size === 0) store.delete(room);

      return res.status(200).json({ items: active });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("typing API error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}