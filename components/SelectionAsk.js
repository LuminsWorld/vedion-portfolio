import { useState, useEffect, useRef, useCallback } from 'react'

function InlineText({ text }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`'))
          return <code key={i} style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.88em', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, color: '#ce9178' }}>{part.slice(1, -1)}</code>
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} style={{ color: '#fff', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
        if (part.startsWith('*') && part.endsWith('*'))
          return <em key={i} style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.85)' }}>{part.slice(1, -1)}</em>
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

export default function SelectionAsk({ courseId, moduleId }) {
  const [tooltip, setTooltip]     = useState(null)   // { x, y, text }
  const [modal, setModal]         = useState(null)   // { selectedText }
  const [question, setQuestion]   = useState('')
  const [response, setResponse]   = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [credits, setCredits]     = useState(null)
  const inputRef                  = useRef(null)
  const tooltipRef                = useRef(null)

  /* ─── Selection detection ─── */
  const handleMouseUp = useCallback(() => {
    // Small delay so selection is finalised
    setTimeout(() => {
      const sel = window.getSelection()
      const text = sel?.toString().trim()
      if (!text || text.length < 3) { setTooltip(null); return }
      try {
        const range = sel.getRangeAt(0)
        const rect  = range.getBoundingClientRect()
        setTooltip({
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top - 8),
          text,
        })
      } catch { setTooltip(null) }
    }, 30)
  }, [])

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseUp])

  /* ─── Hide tooltip when clicking away ─── */
  useEffect(() => {
    function onMouseDown(e) {
      if (tooltipRef.current?.contains(e.target)) return
      setTooltip(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  /* ─── Open modal ─── */
  function openModal() {
    if (!tooltip) return
    setModal({ selectedText: tooltip.text })
    setTooltip(null)
    setQuestion('')
    setResponse(null)
    setError(null)
    setCredits(null)
    window.getSelection()?.removeAllRanges()
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  function closeModal() {
    setModal(null)
    setResponse(null)
    setQuestion('')
    setError(null)
  }

  /* ─── Submit question ─── */
  async function submit() {
    if (!question.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const { auth } = await import('../lib/firebase')
      const user = auth.currentUser
      if (!user) { setError('Not signed in.'); setLoading(false); return }
      const token = await user.getIdToken()

      const res = await fetch('/api/learn/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          courseId,
          moduleId,
          selectedText: modal.selectedText,
          question: question.trim(),
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.upgradeRequired ? 'AI chat requires a Pro or Ultra plan.' : data.error)
      } else {
        setResponse(data.answer)
        setCredits(data.creditsRemaining)
      }
    } catch { setError('Request failed.') }
    setLoading(false)
  }

  return (
    <>
      {/* ── Floating tooltip ── */}
      {tooltip && (
        <div ref={tooltipRef} style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translateX(-50%) translateY(-100%)',
          zIndex: 9999,
          pointerEvents: 'all',
          userSelect: 'none',
        }}>
          {/* Arrow */}
          <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #A855F7' }} />
          <button onClick={openModal} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#A855F7',
            border: 'none',
            borderRadius: 6,
            padding: '7px 14px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            cursor: 'pointer',
            letterSpacing: '0.08em',
            boxShadow: '0 4px 20px rgba(168,85,247,0.45)',
            whiteSpace: 'nowrap',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            ASK AI
          </button>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div style={{
            background: '#0d1117',
            border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: 12,
            padding: 24,
            width: '100%',
            maxWidth: 520,
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#A855F7', letterSpacing: '0.18em' }}>ASK AI</span>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2 }}>
                ×
              </button>
            </div>

            {/* Selected text quote */}
            <div style={{
              padding: '10px 14px',
              background: 'rgba(168,85,247,0.05)',
              border: '1px solid rgba(168,85,247,0.15)',
              borderLeft: '3px solid #A855F7',
              borderRadius: 6,
              marginBottom: 18,
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(168,85,247,0.5)', letterSpacing: '0.12em', marginBottom: 6 }}>SELECTED TEXT</div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.65, maxHeight: 90, overflowY: 'auto' }}>
                {modal.selectedText.length > 400
                  ? modal.selectedText.slice(0, 400) + '...'
                  : modal.selectedText}
              </p>
            </div>

            {/* ── Response view ── */}
            {response ? (
              <>
                <div style={{
                  padding: '14px 16px',
                  background: 'rgba(168,85,247,0.06)',
                  border: '1px solid rgba(168,85,247,0.2)',
                  borderRadius: 8,
                  borderLeft: '3px solid #A855F7',
                  marginBottom: 16,
                }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(168,85,247,0.7)', letterSpacing: '0.15em', marginBottom: 10 }}>ANSWER</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}>
                    <InlineText text={response.replace(/^#+\s*\w[^\n]*/,'').trim()} />
                  </div>
                </div>
                {credits !== null && (
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.18)', marginBottom: 14 }}>
                    {credits} CREDITS REMAINING
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { setResponse(null); setQuestion(''); setTimeout(() => inputRef.current?.focus(), 50) }}
                    style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#A855F7', borderRadius: 6, padding: '9px 18px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, cursor: 'pointer', letterSpacing: '0.06em' }}
                  >
                    ASK ANOTHER
                  </button>
                  <button
                    onClick={closeModal}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', borderRadius: 6, padding: '9px 18px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, cursor: 'pointer' }}
                  >
                    CLOSE
                  </button>
                </div>
              </>
            ) : (
              /* ── Question input view ── */
              <>
                <textarea
                  ref={inputRef}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
                  placeholder="What do you want to know about this?"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 14,
                    color: '#fff',
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: 1.6,
                    marginBottom: 12,
                  }}
                />
                {error && (
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#FF2D55', marginBottom: 12, lineHeight: 1.5 }}>
                    {error}
                    {error.includes('Pro') && (
                      <a href="/pricing" style={{ color: '#A855F7', marginLeft: 8, textDecoration: 'none', fontWeight: 700 }}>UPGRADE →</a>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>
                    2 CREDITS · PRO / ULTRA
                  </span>
                  <button
                    onClick={submit}
                    disabled={!question.trim() || loading}
                    style={{
                      background: question.trim() && !loading ? '#A855F7' : 'rgba(168,85,247,0.2)',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 26px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#fff',
                      cursor: question.trim() && !loading ? 'pointer' : 'not-allowed',
                      letterSpacing: '0.06em',
                      transition: 'background 0.15s',
                    }}
                  >
                    {loading ? 'THINKING...' : 'ASK'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
