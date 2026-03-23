import { useState } from 'react'
import Head from 'next/head'

const m = { fontFamily: 'monospace' }

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed]   = useState(false)
  const [genCourse, setGenCourse] = useState('')
  const [genExams, setGenExams]   = useState('')
  const [genCount, setGenCount]   = useState(20)
  const [genLoading, setGenLoading] = useState(false)
  const [genResult, setGenResult]   = useState('')
  const [authErr, setAuthErr] = useState('')
  const [codes, setCodes]   = useState([])
  const [count, setCount]     = useState(1)
  const [note, setNote]       = useState('')
  const [plan, setPlan]       = useState('free')
  const [duration, setDuration] = useState('indefinite')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]       = useState('')
  const [copied, setCopied] = useState(null)

  async function apiReq(method, body) {
    const res = await fetch('/api/admin/codes', {
      method,
      headers: { 'Authorization': `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    if (res.status === 401) throw new Error('Wrong secret')
    if (!res.ok) throw new Error(data.error ?? 'Unknown error')
    return data
  }

  async function handleLogin() {
    setAuthErr('')
    try {
      await apiReq('GET')
      setAuthed(true)
      await loadCodes()
    } catch (e) {
      setAuthErr(e.message)
    }
  }

  async function generateQuiz() {
    if (!genCourse.trim()) return
    setGenLoading(true); setGenResult('')
    try {
      const res = await fetch('/api/admin/generate-quiz', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: genCourse.trim(), examExamples: genExams || null, questionsPerModule: parseInt(genCount) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      const summary = data.results.map(r => r.error ? `${r.moduleId}: ERROR — ${r.error}` : `${r.moduleId}: ${r.generated} questions`).join('\n')
      setGenResult(summary)
    } catch (e) {
      setGenResult('Error: ' + e.message)
    } finally { setGenLoading(false) }
  }

  async function loadCodes() {
    const data = await apiReq('GET')
    const sorted = (data.codes ?? []).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    setCodes(sorted)
  }

  async function generate() {
    setLoading(true); setMsg('')
    try {
      const data = await apiReq('POST', { count: parseInt(count), note, plan, duration })
      setMsg(`Generated: ${data.codes.join(', ')}`)
      await loadCodes()
    } catch (e) {
      setMsg('Error: ' + e.message)
    } finally { setLoading(false) }
  }

  function copy(code) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 1500)
  }

  const inp = { background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#fff', ...m, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const sel = { ...inp, cursor: 'pointer' }
  const btn = { background: '#00FF41', color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', ...m, fontWeight: 900, fontSize: 13, letterSpacing: 1, cursor: 'pointer' }

  const PLAN_COLORS = { free: '#00FF41', pro: '#00D4FF', ultra: '#7B2FFF' }
  const PLAN_LABELS = { free: 'Free', pro: 'Pro', ultra: 'Ultra' }
  const DUR_LABELS  = { '7': '7 days', '30': '30 days', '90': '90 days', '365': '1 year', indefinite: 'Indefinite' }

  if (!authed) return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Head><title>Admin — Vedion</title></Head>
      <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ ...m, color: '#00FF41', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: 3 }}>VEDION ADMIN</p>
        <input type="password" value={secret} onChange={e => setSecret(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="Admin secret" style={inp} />
        {authErr && <p style={{ ...m, color: '#FF2D55', fontSize: 12, margin: 0 }}>{authErr}</p>}
        <button onClick={handleLogin} style={btn}>ENTER</button>
      </div>
    </div>
  )

  const unused = codes.filter(c => !c.used)
  const used   = codes.filter(c => c.used)

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', padding: 24 }}>
      <Head><title>Admin — Vedion</title></Head>
      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...m, color: '#00FF41', fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: 3 }}>VEDION ADMIN</p>
          <a href="/" style={{ ...m, color: 'rgba(255,255,255,0.3)', fontSize: 11, textDecoration: 'none' }}>← SITE</a>
        </div>

        {/* Generate */}
        <div style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ ...m, fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', margin: 0 }}>GENERATE CODES</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" min="1" max="50" value={count} onChange={e => setCount(e.target.value)}
              style={{ ...inp, width: 64 }} placeholder="#" />
            <select value={plan} onChange={e => setPlan(e.target.value)} style={{ ...sel, flex: 1, color: PLAN_COLORS[plan] }}>
              <option value="free">Free tier</option>
              <option value="pro">Pro tier</option>
              <option value="ultra">Ultra tier</option>
            </select>
            <select value={duration} onChange={e => setDuration(e.target.value)} style={{ ...sel, flex: 1 }}>
              <option value="indefinite">Indefinite</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={note} onChange={e => setNote(e.target.value)}
              style={{ ...inp, flex: 1 }} placeholder="Note (optional)" />
            <button onClick={generate} disabled={loading} style={{ ...btn, whiteSpace: 'nowrap', opacity: loading ? 0.5 : 1 }}>
              {loading ? '...' : 'GENERATE'}
            </button>
          </div>
          {msg && <p style={{ ...m, fontSize: 12, color: '#00FF41', margin: 0, wordBreak: 'break-all' }}>{msg}</p>}
        </div>

        {/* Generate Quiz */}
        <div style={{ background: '#0D0D0D', border: '1px solid rgba(255,184,0,0.15)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ ...m, fontSize: 10, letterSpacing: 2, color: '#FFB800', margin: 0 }}>GENERATE QUIZ QUESTIONS</p>
          <p style={{ ...m, fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            Claude Sonnet generates questions matching your exam format but covering all the module content.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={genCourse} onChange={e => setGenCourse(e.target.value)}
              style={{ ...inp, flex: 1 }} placeholder="Course ID (e.g. cs320)" />
            <input type="number" min="5" max="30" value={genCount} onChange={e => setGenCount(e.target.value)}
              style={{ ...inp, width: 80 }} placeholder="# Qs" />
          </div>
          <textarea value={genExams} onChange={e => setGenExams(e.target.value)}
            rows={6} placeholder="Paste exam questions here (optional but recommended — defines the format/style)..."
            style={{ ...inp, resize: 'vertical', fontSize: 12 }} />
          <button onClick={generateQuiz} disabled={!genCourse.trim() || genLoading}
            style={{ ...btn, background: '#FFB800', opacity: !genCourse.trim() || genLoading ? 0.4 : 1 }}>
            {genLoading ? 'GENERATING...' : 'GENERATE QUIZZES'}
          </button>
          {genResult && (
            <pre style={{ ...m, fontSize: 11, color: '#00FF41', background: '#000', borderRadius: 6, padding: 10, margin: 0, whiteSpace: 'pre-wrap' }}>
              {genResult}
            </pre>
          )}
        </div>

        {/* Unused codes */}
        <div style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
          <p style={{ ...m, fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', margin: '0 0 10px' }}>
            UNUSED CODES ({unused.length})
          </p>
          {unused.length === 0 && <p style={{ ...m, fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0 }}>None</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {unused.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#000', borderRadius: 8, padding: '8px 12px', gap: 8 }}>
                <span style={{ ...m, fontSize: 15, letterSpacing: 3, color: '#00FF41' }}>{c.id}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {c.plan && <span style={{ ...m, fontSize: 9, letterSpacing: 1, color: PLAN_COLORS[c.plan] ?? '#fff', border: `1px solid ${PLAN_COLORS[c.plan] ?? '#fff'}55`, borderRadius: 4, padding: '1px 6px' }}>{(PLAN_LABELS[c.plan] ?? c.plan).toUpperCase()}</span>}
                  {c.duration && <span style={{ ...m, fontSize: 9, color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 6px' }}>{DUR_LABELS[c.duration] ?? c.duration}</span>}
                  {c.note && <span style={{ ...m, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{c.note}</span>}
                  <button onClick={() => copy(c.id)} style={{ ...btn, padding: '4px 10px', fontSize: 10, background: copied === c.id ? '#00D4FF' : '#00FF41' }}>
                    {copied === c.id ? 'COPIED' : 'COPY'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Used codes */}
        {used.length > 0 && (
          <div style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 }}>
            <p style={{ ...m, fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.2)', margin: '0 0 10px' }}>
              USED CODES ({used.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {used.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6 }}>
                  <span style={{ ...m, fontSize: 13, letterSpacing: 2, color: 'rgba(255,255,255,0.25)', textDecoration: 'line-through' }}>{c.id}</span>
                  <span style={{ ...m, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{c.usedBy?.slice(0, 8)}…</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
