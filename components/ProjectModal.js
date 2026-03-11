import { useEffect, useRef, useState } from 'react';

const INLINE_CHAT_MESSAGES = [
  { role: 'vedion', text: 'Hey. Ask me anything about this project.' },
];

function InlineChat() {
  const [messages, setMessages] = useState(INLINE_CHAT_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'vedion', text: data.reply || 'No response.' }]);
    } catch {
      setMessages(m => [...m, { role: 'vedion', text: 'Connection error.' }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', scrollbarWidth: 'thin', scrollbarColor: '#7B2FFF transparent' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: m.role === 'user' ? 'rgba(255,255,255,0.3)' : '#7B2FFF', marginBottom: '3px' }}>
              {m.role === 'user' ? 'YOU' : 'VEDION'}
            </span>
            <div style={{
              maxWidth: '85%',
              padding: '0.5rem 0.75rem',
              background: m.role === 'user' ? 'rgba(255,255,255,0.06)' : 'rgba(123,47,255,0.12)',
              border: `1px solid ${m.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(123,47,255,0.3)'}`,
              borderRadius: '6px',
              color: m.role === 'user' ? '#fff' : '#d4b4ff',
              lineHeight: 1.6,
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ color: '#7B2FFF', opacity: 0.6 }}>
            <span style={{ animation: 'blink 1s steps(1) infinite' }}>▋</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(123,47,255,0.2)', display: 'flex', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask Vedion..."
          style={{ flex: 1, background: 'transparent', border: '1px solid rgba(123,47,255,0.3)', borderRadius: '4px', color: '#fff', padding: '0.4rem 0.6rem', fontFamily: 'JetBrains Mono', fontSize: '12px', outline: 'none' }}
        />
        <button onClick={send} style={{ background: '#7B2FFF', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.4rem 0.7rem', fontFamily: 'JetBrains Mono', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
          SEND
        </button>
      </div>
    </div>
  );
}

export default function ProjectModal({ project, onClose, analyserRef }) {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Beat-reactive border glow
  useEffect(() => {
    if (!analyserRef?.current) return;
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!panelRef.current || !analyserRef.current) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const bass = data.slice(0, 8).reduce((a, b) => a + b, 0) / 8 / 255;
      const glow = 10 + bass * 50;
      panelRef.current.style.boxShadow = `0 0 ${glow}px ${project.colorHex}55, 0 0 ${glow * 2}px ${project.colorHex}22, inset 0 0 ${glow * 0.5}px ${project.colorHex}11`;
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [project.colorHex]);

  const handleOverlayClick = e => {
    if (e.target === e.currentTarget) onClose();
  };

  // On mobile: stack vertically; on desktop: row for chat projects
  const bodyDirection = (!isMobile && project.hasChat) ? 'row' : 'column';
  const chatHeight = isMobile ? '260px' : '100%';
  const chatWidth = isMobile ? '100%' : '300px';

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '0.5rem' : '1rem',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        ref={panelRef}
        className={visible ? 'modal-panel-in' : ''}
        style={{
          width: '100%',
          maxWidth: project.hasChat && !isMobile ? '900px' : '680px',
          maxHeight: isMobile ? '92vh' : '88vh',
          background: '#050505',
          border: `1px solid ${project.colorHex}55`,
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Scan lines overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)', pointerEvents: 'none', zIndex: 1 }} />

        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: `1px solid ${project.colorHex}33`, position: 'relative', zIndex: 2, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: project.colorHex, boxShadow: `0 0 8px ${project.colorHex}`, flexShrink: 0 }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: isMobile ? '10px' : '11px', letterSpacing: '0.2em', color: project.colorHex }}>
              {project.title.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: `1px solid rgba(255,255,255,0.15)`, color: 'rgba(255,255,255,0.5)', width: 28, height: 28, borderRadius: '4px', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: bodyDirection, position: 'relative', zIndex: 2, minHeight: 0 }}>

          {/* Main content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {project.tags.map(t => (
                <span key={t} style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: project.colorHex, border: `1px solid ${project.colorHex}44`, padding: '2px 8px', borderRadius: '2px' }}>{t}</span>
              ))}
            </div>

            {/* Detail text */}
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, fontSize: isMobile ? '13px' : '14px', margin: 0 }}>
              {project.detail}
            </p>

            {/* Highlights */}
            {project.highlights && project.highlights.length > 0 && (
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', letterSpacing: '0.25em', color: project.colorHex, marginBottom: '0.5rem' }}>HIGHLIGHTS</div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {project.highlights.map((h, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                      <span style={{ color: project.colorHex, marginTop: '2px', flexShrink: 0 }}>▸</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!project.isPlaceholder && (
              <div style={{ border: `1px dashed ${project.colorHex}33`, borderRadius: '6px', padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '0.2em' }}>
                [ SCREENSHOT COMING SOON ]
              </div>
            )}

            {project.isPlaceholder && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2rem', color: project.colorHex, letterSpacing: '0.1em', opacity: 0.4 }}>///</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.3em', marginTop: '1rem' }}>IN DEVELOPMENT</div>
              </div>
            )}
          </div>

          {/* Chat panel — Vedion only */}
          {project.hasChat && (
            <div style={{
              width: chatWidth,
              height: isMobile ? chatHeight : 'auto',
              borderTop: isMobile ? `1px solid ${project.colorHex}22` : 'none',
              borderLeft: isMobile ? 'none' : `1px solid ${project.colorHex}22`,
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              minHeight: 0,
            }}>
              <div style={{ padding: '0.6rem 1rem', borderBottom: `1px solid ${project.colorHex}22`, fontFamily: 'JetBrains Mono', fontSize: '10px', letterSpacing: '0.2em', color: project.colorHex, flexShrink: 0 }}>
                LIVE CHAT — VEDION
              </div>
              <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <InlineChat />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
