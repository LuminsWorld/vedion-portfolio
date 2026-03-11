import { useState, useRef, useEffect } from 'react';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'vedion', text: "Hey. I'm Vedion — Austin's AI. Ask me anything about his work." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'vedion', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'vedion', text: 'Connection lost. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-widget">
      <div className={open ? "chat-panel" : "chat-panel hidden"}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(0,255,65,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: "11px", color: "var(--green)", letterSpacing: "0.2em" }}>VEDION_AI</span>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
        </div>
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: "0.75rem" }}>
              <div className="msg-prefix">{m.role === "vedion" ? "> VEDION" : "> YOU"}</div>
              <div className={m.role === "vedion" ? "msg-vedion" : "msg-user"}>{m.text}</div>
            </div>
          ))}
          {loading && <div className="msg-vedion" style={{ opacity: 0.5 }}>thinking_</div>}
          <div ref={endRef} />
        </div>
        <div className="chat-input-row">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="ask me anything_"
          />
          <button onClick={send}>SEND</button>
        </div>
      </div>
      <div className="chat-bubble" onClick={() => setOpen(!open)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00FF41" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
    </div>
  );
}
