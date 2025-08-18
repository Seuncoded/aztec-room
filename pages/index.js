// pages/index.js
import { useEffect, useRef, useState } from "react";
import { generateAztecHandle } from "../lib/aztecName";


const ROOMS = ["general", "validators", "helpdesk", "18+"];

function pillId(r) {
  return r === "18+" ? "18plus" : r; 
}

function labelForRoom(r) {
  if (r === "18+") return "18+";
  return r.charAt(0).toUpperCase() + r.slice(1);
}

const colorFromHandle = (handle) => {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) hash = handle.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 55%)`;
};

export default function AztecRoom() {

  const [room, setRoom] = useState("general");

 
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [typingHandles, setTypingHandles] = useState([]);
const typingPollRef = useRef(null);
let typingPingTimer = null; 

  
  const [session, setSession] = useState("");

 
  const [dmWith, setDmWith] = useState("");
  const [dmMessages, setDmMessages] = useState([]);
  const [dmText, setDmText] = useState("");
  const [dmSending, setDmSending] = useState(false);

  
  const scrollerRef = useRef(null);
  const pollRef = useRef(null);
  const dmPollRef = useRef(null);

  
  useEffect(() => {
  if (typeof window === "undefined") return;
  let s = window.sessionStorage.getItem("azr-session");
  if (!s) {
    s = generateAztecHandle();            
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
        requestAnimationFrame(() =>
          scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "auto" })
        );
      } else {
        console.error("Room fetch error:", j);
      }
    } catch (e) {
      console.error("Room fetch error:", e);
    }
  };

  const pingTyping = () => {

  if (typingPingTimer) return;
  typingPingTimer = setTimeout(() => { typingPingTimer = null; }, 1000);
  fetch("/api/typing", {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ room, handle: session })
  }).catch(()=>{});
};

const pollTyping = async (r) => {
  try {
    const res = await fetch(`/api/typing?room=${encodeURIComponent(r)}`, { cache: "no-store" });
    const j = await res.json();
    if (res.ok) setTypingHandles(j.items?.filter(h => h !== session) || []);
  } catch(e){ /* noop */ }
};

  useEffect(() => {
  if (!room) return;
  fetchRoom(room);

  clearInterval(pollRef.current);
  pollRef.current = setInterval(() => fetchRoom(room), 2500);

  clearInterval(typingPollRef.current);
  typingPollRef.current = setInterval(() => pollTyping(room), 1200);
  pollTyping(room);

  return () => {
    clearInterval(pollRef.current);
    clearInterval(typingPollRef.current);
  };
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
      const raw = await res.text();
      let j = {};
      try { j = raw ? JSON.parse(raw) : {}; } catch {}
      if (!res.ok) {
        alert(j.error || raw || "Failed to send");
      } else {
        setText("");
        setMessages(prev => (j.item ? [...prev, j.item] : prev));
        requestAnimationFrame(() =>
          scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior:"smooth" })
        );
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setSending(false);
    }
  };

  
  const openDM = (handle) => {
    if (!handle || handle === session) return;
    setDmWith(handle);
  };

  const closeDM = () => {
    setDmWith("");
    setDmMessages([]);
    clearInterval(dmPollRef.current);
  };

  const fetchDM = async (me, other) => {
    try {
      const res = await fetch(
        `/api/dm?me=${encodeURIComponent(me)}&with=${encodeURIComponent(other)}&limit=100`,
        { cache: "no-store" }
      );
      const j = await res.json();
      if (res.ok) setDmMessages(j.items || []);
    } catch (e) {
      console.error("DM fetch error", e);
    }
  };

  useEffect(() => {
    if (!dmWith || !session) return;
    fetchDM(session, dmWith);
    clearInterval(dmPollRef.current);
    dmPollRef.current = setInterval(() => fetchDM(session, dmWith), 5000);
    return () => clearInterval(dmPollRef.current);
  }, [dmWith, session]);

  const sendDM = async () => {
    const t = dmText.trim();
    if (!t || !dmWith) return;
    setDmSending(true);
    try {
      const res = await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: session, to: dmWith, text: t })
      });
      const raw = await res.text();
      let j = {};
      try { j = raw ? JSON.parse(raw) : {}; } catch {}
      if (!res.ok) {
        console.error("DM error:", raw);
        alert(j.error || raw || "DM failed");
      } else {
        setDmText("");
        setDmMessages(prev => (j.item ? [...prev, j.item] : prev));
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setDmSending(false);
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
          {ROOMS.map((r) => (
            <button
              key={r}
              className={`pill ${r === room ? "active" : ""}`}
              data-room={pillId(r)}
              onClick={() => setRoom(r)}
            >
              {labelForRoom(r)}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="panel">
        <div className="chat">
          <div className="chatHead" data-room={pillId(room)}>
            <span className="dot"></span>
            <span className="roomCap">{labelForRoom(room)}</span>
          </div>

{typingHandles.length > 0 && (
  <div className="typingBar">
    {typingHandles.slice(0, 3).map((h, i) => (
      <span className="typeDot" key={h + i}>@{h}</span>
    ))}
    <span className="typeAnim">
      <span></span><span></span><span></span>
    </span>
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
                        onClick={() => openDM(m.handle)}
                        style={{
                          backgroundColor: isMine ? "transparent" : colorFromHandle(m.handle),
                          color: isMine ? "#fff" : "#000",
                          padding: "2px 6px",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          cursor: "pointer"
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
  onInput={pingTyping}              
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

      {/* DM modal */}
      {dmWith && (
        <div className="dmOverlay" onClick={closeDM}>
          <div className="dmCard" onClick={(e) => e.stopPropagation()}>
            <div className="dmHead">
              <div className="dmTitle">DM with <span className="dmHandle">@{dmWith}</span></div>
              <button className="dmClose" onClick={closeDM}>×</button>
            </div>

            <div className="dmScroll">
              {dmMessages.length === 0 ? (
                <div className="empty">Say hello 👋</div>
              ) : (
                dmMessages.map(m => {
                  const mine = m.from_handle === session;
                  return (
                    <div key={m.id} className={`msg ${mine ? "me" : ""}`}>
                      <div className="meta">
                        <span
                          className="handle"
                          style={{
                            backgroundColor: mine ? "transparent" : colorFromHandle(m.from_handle),
                            color: mine ? "#fff" : "#000"
                          }}
                        >
                          @{m.from_handle}
                        </span>
                        <span className="when">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
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
                placeholder={`Message @${dmWith}…`}
                value={dmText}
                onChange={(e)=> setDmText(e.target.value)}
                onKeyDown={(e)=> e.key === "Enter" && sendDM()}
              />
              <button className="btn" onClick={sendDM} disabled={dmSending}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}