// pages/index.js
import { useEffect, useRef, useState } from "react";



const ROOMS = ["General", "Validators", "Helpdesk", "18+"];


function pillId(r) {
  if (r === "18+") return "18plus";
  return r; 
}


function niceLabel(r) {
  if (r === "off-topic") return "Off Topic";
  if (r === "18+") return "18+";
  return r.charAt(0).toUpperCase() + r.slice(1);
}


const colorFromHandle = (handle) => {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) {
    hash = handle.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 55%)`;
};

export default function AztecRoom() {
  const [room, setRoom] = useState(ROOMS[0]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState("");
  const scrollerRef = useRef(null);
  const pollRef = useRef(null);

  
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
    } catch (e) {
      console.error(e);
    }
  };


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
        body: JSON.stringify({ room, text: t, handle: session })
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
    {["general", "validators", "helpdesk", "18+"].map((r) => {
      const dataRoom = r === "18+" ? "18plus" : r; // <-- key line
      const label =
        r === "helpdesk" ? "Helpdesk" :
        r === "validators" ? "Validators" :
        r === "general" ? "General" : "18+";

      return (
        <button
          key={r}
          className={`pill ${r === room ? "active" : ""}`}
          data-room={dataRoom}                     // <-- add this
          onClick={() => setRoom(r)}
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
    backgroundColor: isMine ? "transparent" : colorFromHandle(m.handle),
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

