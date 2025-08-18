// pages/api/typing.js
let TYPING = new Map(); // key: room, value: Map(handle -> expiresAt)

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const now = Date.now();
  
  for (const [room, map] of TYPING) {
    for (const [h, t] of map) if (t < now) map.delete(h);
    if (map.size === 0) TYPING.delete(room);
  }

  if (req.method === "POST") {
    const { room, handle } = req.body || {};
    if (!room || !handle) return res.status(400).json({ error: "room & handle required" });
    const m = TYPING.get(room) || new Map();
    m.set(handle, now + 4000); 
    TYPING.set(room, m);
    return res.json({ ok: true });
  }

  if (req.method === "GET") {
    const room = String(req.query.room || "");
    const m = TYPING.get(room) || new Map();
    return res.json({ items: Array.from(m.keys()) });
  }

  return res.status(405).json({ error: "Method not allowed" });
}