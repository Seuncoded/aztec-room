// pages/api/dm.js
import getSupabaseAdmin from "../../lib/supabaseAdmin";

function threadId(a, b) {
  const [x, y] = [a, b].sort();
  return `dm:${x}__${y}`;
}

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseAdmin();

    if (req.method === "POST") {
      const { from, to, text } = req.body || {};
      if (!from || !to || !text)
        return res.status(400).json({ error: "Missing 'from', 'to', or 'text'." });

      const { data, error } = await supabase
        .from("dm_messages")
        .insert({
          thread_id: threadId(from, to),
          from_handle: from,
          to_handle: to,
          text: String(text).slice(0, 1000),
        })
        .select("*")
        .single();

        supabase
  .from("dm_messages")
  .delete()
  .lt("created_at", new Date(Date.now() - 24*60*60*1000).toISOString())
  .then(()=>{}).catch(()=>{});

      if (error) throw error;
      return res.status(200).json({ item: data });
    }

    if (req.method === "GET") {
      const me = String(req.query.me || "");
      const withHandle = String(req.query.with || "");
      const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
      if (!me || !withHandle)
        return res.status(400).json({ error: "Missing 'me' or 'with'." });

      const { data, error } = await supabase
        .from("dm_messages")
        .select("*")
        .eq("thread_id", threadId(me, withHandle))
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return res.status(200).json({ items: data || [] });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error("DM API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}





