// pages/index.js
import { useEffect, useRef, useState } from "react";

// One source of truth
const ROOMS = [
  { id: "general",    label: "General" },
  { id: "validators", label: "Validators" },
  { id: "helpdesk",   label: "Helpdesk" },
  { id: "18plus",     label: "18+" },
];

const colorFromHandle = (handle = "") => {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) hash = handle.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 55%)`;
};

export default function AztecRoom() {
  // store the **id** (e.g., "validators", "18plus")
  const [roomId, setRoomId] = useState(ROOMS[0].id);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState("");
  const scrollerRef = useRef(null);
  const pollRef = useRef(null);

  const currentRoom = ROOMS.find(r => r.id === roomId) ?? ROOMS[0];

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

  const fetchRoom = async (id) => {
    try {
      const q = new URLSearchParams({ room: id, limit: "100" });
      const res = await fetch(`/api/messages?${q.toString()}`, { cache: "no-store" });
      const j = await res.json();
      if (res.ok && j.items) {
        setMessages(j.items);
        requestAnimationFrame(() => {
          scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "auto" });
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!roomId) return;
    fetchRoom(roomId);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchRoom(roomId), 2500);
    return () => clearInterval(pollRef.current);
  }, [roomId]);

  const onSend = async () => {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ room: roomId, text: t, handle: session })
      });
      const j = await res.json();
      if (!res.ok) {
        alert(JSON.stringify(j));
      } else {
        setText("");
        setMessages((prev)=> [...prev, j.item]);
        requestAnimationFrame(() => {
          scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
        });
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setSending(false);
    }
  };

  const niceTime = (iso) => {
    const d = new Date(iso);
    const hh = d.getHours().toString().padStart(2,"0");
    const mm = d.getMinutes().toString().padStart(2,"0");
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
          {ROOMS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`pill ${roomId === id ? "active" : ""}`}
              data-room={id}                 // matches your CSS hooks (use "18plus" here)
              onClick={() => setRoomId(id)}  // store id only
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="panel">
        <div className="chat">
          <div className="chatHead" data-room={currentRoom.id}>
            <span className="dot"></span>
            <span className="roomCap">{currentRoom.label}</span>
          </div>

          <div className="scroll" ref={scrollerRef}>
            {messages.length === 0 ? (
              <div className="empty">No messages yet. Say hi 👋</div>
            ) : (
              messages.map((m)=> {
                const isMine = m.handle === session;
                return (
                  <div className={`msg ${isMine ? "me" : ""}`} key={m.id}>
                    <div className="meta">
                      <span
                        className="handle"
                        style={{
                          backgroundColor: isMine ? "transparent" : colorFromHandle(m.handle || ""),
                          color: isMine ? "#fff" : "#000",
                          padding: "2px 6px",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          fontWeight: "600"
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
              onChange={(e)=> setText(e.target.value)}
              onKeyDown={(e)=> e.key === "Enter" && onSend()}
            />
            <button className="btn" onClick={onSend} disabled={sending}>Send</button>
          </div>
        </div>

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