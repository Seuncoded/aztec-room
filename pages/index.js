// pages/index.js
import { useEffect, useRef, useState } from "react";

// Single source of truth for labels shown in UI
const ROOMS = ["General", "Validators", "Helpdesk", "18+"];

// Map UI label -> API room key
const apiRoom = (label) => (label === "18+" ? "18+" : label.toLowerCase());

// Map UI label -> CSS data-room value (for your pill/chatHead color hooks)
const dataRoom = (label) => (label === "18+" ? "18plus" : label.toLowerCase());

// Labels are already nice
const niceLabel = (label) => label;

// Deterministic color for handles
const colorFromHandle = (handle = "") => {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) hash = handle.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 55%)`;
};

export default function AztecRoom() {
  // Store the UI label directly in state (must match ROOMS items)
  const [room, setRoom] = useState(ROOMS[0]); // "General" on load
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState("");
  const scrollerRef = useRef(null);
  const pollRef = useRef(null);

  // Generate session only in browser
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

  // Fetch messages for current room (convert UI label -> API key)
  const fetchRoom = async (label) => {
    try {
      const r = apiRoom(label);
      const q = new URLSearchParams({ room: r, limit: "100" });
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

  // Room change → load + poll
  useEffect(() => {
    if (!room) return;
    fetchRoom(room);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchRoom(room), 2500);
    return () => clearInterval(pollRef.current);
  }, [room]);

  const onSend = async () => {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        // Convert UI label -> API key here too
        body: JSON.stringify({ room: apiRoom(room), text: t, handle: session })
      });
      const j = await res.json();
      if (!res.ok) {
        alert(JSON.stringify(j));
      } else {
        setText("");
        // Optimistic append
        setMessages((prev) => [...prev, j.item]);
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
          {ROOMS.map((label) => (
            <button
              key={label}
              className={`pill ${label === room ? "active" : ""}`}
              data-room={dataRoom(label)}     // hooks your CSS colors (e.g. 18plus)
              onClick={() => setRoom(label)}  // state stores the UI label
            >
              {niceLabel(label)}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="panel">
        <div className="chat">
          <div className="chatHead" data-room={dataRoom(room)}>
            <span className="dot"></span>
            <span className="roomCap">{niceLabel(room)}</span>
          </div>

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
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSend()}
            />
            <button className="btn" onClick={onSend} disabled={sending}>Send</button>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          Built by{" "}
          <a
            href="https://x.com/seuncoded"
            target="_blank"
            rel="noopener noreferrer"
            className="by"
          >
            Seuncoded
          </a>
        </footer>
      </div>
    </div>
  );
}