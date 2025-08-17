// pages/index.js
import { useEffect, useRef, useState } from "react";
import { sb } from "../lib/supabase"; // <-- NEW

const ROOMS = ["General", "Validators", "Helpdesk", "18+"];

function pillId(r) { return r === "18+" ? "18plus" : r; }
function niceLabel(r) { return r === "18+" ? "18+" : r.charAt(0).toUpperCase()+r.slice(1); }

const colorFromHandle = (handle) => {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) hash = handle.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 55%)`;
};

export default function AztecRoom() {
  const [room, setRoom] = useState(ROOMS[0].toLowerCase()); // store as lowercase
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState("");
  const [typers, setTypers] = useState([]); // <-- NEW
  const scrollerRef = useRef(null);
  const pollRef = useRef(null);
  const typingTimeoutsRef = useRef(new Map()); // handle -> timeoutId
  const channelRef = useRef(null); // supabase realtime channel

  // session handle
  useEffect(() => {
    if (typeof window === "undefined") return;
    let s = window.sessionStorage.getItem("azr-session");
    if (!s) {
      const animals = ["bear","tiger","wolf","owl","lynx","otter","fox","eagle"];
      const adjs = ["silent","mellow","cosmic","lucky","shadow","iron","mystic","steady"];
      s = `${adjs[Math.floor(Math.random()*adjs.length)]}-${animals[Math.floor(Math.random()*animals.length)]}-${Math.floor(Math.random()*900+100)}`;
      window.sessionStorage.setItem("azr-session", s);
    }
    setSession(s);
  }, []);

  // fetch messages
  const fetchRoom = async (r) => {
    try {
      const q = new URLSearchParams({ room: r, limit: "100" });
      const res = await fetch(`/api/messages?${q.toString()}`, { cache: "no-store" });
      const j = await res.json();
      if (res.ok && j.items) {
        setMessages(j.items);
        requestAnimationFrame(() => {
          scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "auto" });
        });
      }
    } catch (e) { console.error(e); }
  };

  // polling and realtime typing channel per room
  useEffect(() => {
    if (!room) return;

    // 1) poll for messages
    fetchRoom(room);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchRoom(room), 2500);

    // 2) supabase realtime channel for typing (no DB)
    // clean previous
    if (channelRef.current) {
      sb.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setTypers([]); // reset visible typers
    typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
    typingTimeoutsRef.current.clear();

    const ch = sb.channel(`room:${room}`);
    channelRef.current = ch;

    ch.on("broadcast", { event: "typing" }, (payload) => {
      const { handle } = payload.payload || {};
      if (!handle || handle === session) return;

      // add/update typer
      setTypers((prev) => {
        if (prev.includes(handle)) return prev;
        return [...prev, handle];
      });

      // auto remove after 3s (refresh if event repeats)
      const old = typingTimeoutsRef.current.get(handle);
      if (old) clearTimeout(old);
      const tid = setTimeout(() => {
        typingTimeoutsRef.current.delete(handle);
        setTypers((prev) => prev.filter((h) => h !== handle));
      }, 3000);
      typingTimeoutsRef.current.set(handle, tid);
    });

    ch.subscribe();

    return () => {
      clearInterval(pollRef.current);
      if (channelRef.current) sb.removeChannel(channelRef.current);
      channelRef.current = null;
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current.clear();
    };
  }, [room, session]);

  // throttle typing broadcasts
  const lastTypedAtRef = useRef(0);
  const sendTyping = () => {
    const now = Date.now();
    if (!channelRef.current) return;
    if (now - lastTypedAtRef.current < 900) return; // ~1s throttle
    lastTypedAtRef.current = now;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { handle: session },
    });
  };

  // send message
  const onSend = async () => {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, text: t, handle: session }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(JSON.stringify(j));
      } else {
        setText("");
        setMessages((prev) => [...prev, j.item]);
        requestAnimationFrame(() => {
          scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
        });
      }
    } catch {
      alert("Network error");
    } finally {
      setSending(false);
    }
  };

  const niceTime = (iso) => {
    const d = new Date(iso);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
  };

  return (
    <div className="shell">
      {/* Header */}
      <div className="header">
        <div className="hgroup">
          <h1 className="title">Aztec Room</h1>
          <p className="tagline">Anonymous chats for the Aztec family</p>
        </div>
        <div className="session">@{session}</div>
      </div>

      {/* Rooms */}
      <div className="rooms">
        <div className="pills">
          {["general", "validators", "helpdesk", "18+"].map((r) => {
            const rKey = r.toLowerCase();
            const dataRoom = rKey === "18+" ? "18plus" : rKey;
            const label =
              rKey === "helpdesk" ? "Helpdesk" :
              rKey === "validators" ? "Validators" :
              rKey === "general" ? "General" : "18+";
            return (
              <button
                key={r}
                className={`pill ${rKey === room ? "active" : ""}`}
                data-room={dataRoom}
                onClick={() => setRoom(rKey)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      <div className="panel">
        <div className="chat">
          <div className="chatHead" data-room={pillId(room)}>
            <span className="dot"></span>
            <span className="roomCap">{niceLabel(room)}</span>
          </div>

          {/* Typing bar (NEW) */}
          {/* Typing bar (fancy) */}
{typers.length > 0 && (
  <div className="typingBar">
    <div className="typingLeft">
      {typers.slice(0, 3).map((h) => (
        <div
  key={h}
  className="typingAv"
  title={h}
  style={{ background: colorFromHandle(h) }}
>
  <div className="pulse" />
  <span className="initial">{h.replace(/^@?/, "").charAt(0).toUpperCase()}</span>
</div>
      ))}
      <div className="typingText">
        {typers.length === 1
          ? `${typers[0]} is typing`
          : `${typers[0]} & ${typers[1]}${
              typers.length > 2 ? ` +${typers.length - 2}` : ""
            } are typing`}
      </div>
    </div>
    <div className="typingDots">
      <span className="dot d1" />
      <span className="dot d2" />
      <span className="dot d3" />
    </div>
  </div>
)}

          <div className="scroll" ref={scrollerRef}>
            {messages.length === 0 ? (
              <div className="empty">No messages yet. Say hi 👋</div>
            ) : (
              messages.map((m) => {
                const isMine = m.handle === session;
                return (
                  <div className={`msg ${isMine ? "me" : ""}`} key={m.id}>
                    <div className="meta">
                      <span
                        className="handle"
                        style={{
                          backgroundColor: isMine ? "transparent" : colorFromHandle(m.handle),
                          color: isMine ? "#fff" : "#000",
                          padding: "2px 6px",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                        }}
                      >
                        @{m.handle || "anon"}
                      </span>
                      <span className="when">{niceTime(m.created_at)}</span>
                    </div>
                    <div className="text">{m.text}</div>
                  </div>
                );
              })
            )}
          </div>

          <div className="compose">
            <input
              className="input"
              type="text"
              placeholder="Type a message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={sendTyping}           // <-- NEW: broadcast typing
            />
            <button className="btn" onClick={onSend} disabled={sending}>Send</button>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          Built by{" "}
          <a href="https://x.com/seuncoded" target="_blank" rel="noopener noreferrer" className="by">
            Seuncoded
          </a>
        </footer>
      </div>
    </div>
  );
}