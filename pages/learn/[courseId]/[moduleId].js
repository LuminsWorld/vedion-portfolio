import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { getCourse } from '../../../lib/courseData'
import LearnAccountButton from '../../../components/LearnAccountButton'
import FlashcardStudy from '../../../components/FlashcardStudy'

export async function getStaticPaths() {
  const { getAllCourses } = await import('../../../lib/courseData')
  const paths = []
  getAllCourses().forEach(c => {
    const full = require(`../../../content/courses/${c.id}.json`)
    full.modules.forEach(m => paths.push({ params: { courseId: c.id, moduleId: m.id } }))
  })
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const course = getCourse(params.courseId)
  if (!course) return { notFound: true }
  const mod = course.modules.find(m => m.id === params.moduleId)
  if (!mod) return { notFound: true }
  const modIndex = course.modules.findIndex(m => m.id === params.moduleId)
  const prevMod = course.modules[modIndex - 1] ?? null
  const nextMod = course.modules[modIndex + 1] ?? null
  return { props: { course, mod, modIndex, prevMod, nextMod } }
}

// ─── Visualization Components ───

function BellCurveViz() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
      <defs>
        <style>{`
          @keyframes drawCurve { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
          .curve { animation: drawCurve 2s ease-in-out forwards; stroke-dasharray: 1000; }
        `}</style>
      </defs>
      {/* Grid */}
      <line x1="40" y1="150" x2="260" y2="150" stroke="var(--border)" strokeWidth="1" />
      <line x1="40" y1="20" x2="40" y2="150" stroke="var(--border)" strokeWidth="1" />
      {/* Bell curve */}
      <path
        d="M 40 140 Q 80 100 100 60 Q 120 30 150 20 Q 180 30 200 60 Q 220 100 260 140"
        fill="none"
        stroke="var(--green)"
        strokeWidth="2.5"
        className="curve"
      />
      {/* Labels */}
      <text x="40" y="170" fontSize="11" fill="var(--text-muted)" fontFamily="JetBrains Mono">μ</text>
      <text x="140" y="170" fontSize="11" fill="var(--text-muted)" fontFamily="JetBrains Mono">Mean</text>
    </svg>
  )
}

function ScatterPlotViz() {
  const points = Array.from({ length: 30 }, () => ({
    x: Math.random() * 220 + 40,
    y: Math.random() * 120 + 30,
  }))
  return (
    <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
      <defs>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .point { animation: fadeIn 1.5s ease-out forwards; }
        `}</style>
      </defs>
      {/* Grid */}
      <line x1="40" y1="150" x2="260" y2="150" stroke="var(--border)" strokeWidth="1" />
      <line x1="40" y1="20" x2="40" y2="150" stroke="var(--border)" strokeWidth="1" />
      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="var(--green)" className="point" style={{ animationDelay: `${i * 30}ms` }} />
      ))}
      {/* Regression line */}
      <line x1="45" y1="135" x2="255" y2="35" stroke="var(--green)" strokeWidth="1.5" opacity="0.4" strokeDasharray="5,5" />
    </svg>
  )
}

function RegexViz() {
  const text = 'hello123world456'
  return (
    <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
      <defs>
        <style>{`
          @keyframes slide { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          .block { animation: slide 0.5s ease-out forwards; }
        `}</style>
      </defs>
      {/* Text */}
      <text x="30" y="50" fontSize="13" fill="var(--text-muted)" fontFamily="JetBrains Mono">{text}</text>
      {/* Pattern blocks */}
      <rect x="30" y="70" width="50" height="30" fill="var(--green)" opacity="0.2" rx="4" className="block" />
      <rect x="90" y="70" width="35" height="30" fill="var(--green)" opacity="0.4" rx="4" className="block" style={{ animationDelay: '100ms' }} />
      <rect x="135" y="70" width="50" height="30" fill="var(--green)" opacity="0.2" rx="4" className="block" style={{ animationDelay: '200ms' }} />
      <rect x="195" y="70" width="35" height="30" fill="var(--green)" opacity="0.4" rx="4" className="block" style={{ animationDelay: '300ms' }} />
      {/* Labels */}
      <text x="35" y="130" fontSize="10" fill="var(--green)" fontFamily="JetBrains Mono">letters</text>
      <text x="100" y="130" fontSize="10" fill="var(--green)" fontFamily="JetBrains Mono">digits</text>
    </svg>
  )
}

function GeoViz() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
      <defs>
        <style>{`
          @keyframes pulse { from { r: 2; } 50% { r: 4; } to { r: 2; } }
          .marker { animation: pulse 2s ease-in-out infinite; }
        `}</style>
      </defs>
      {/* Grid */}
      <line x1="40" y1="100" x2="260" y2="100" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
      <line x1="150" y1="20" x2="150" y2="180" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
      {/* Markers */}
      <circle cx="80" cy="60" r="3" fill="var(--green)" className="marker" />
      <circle cx="220" cy="140" r="3" fill="var(--green)" className="marker" style={{ animationDelay: '0.5s' }} />
      <circle cx="150" cy="100" r="3" fill="var(--green)" className="marker" style={{ animationDelay: '1s' }} />
      {/* Labels */}
      <text x="20" y="105" fontSize="10" fill="var(--text-muted)" fontFamily="JetBrains Mono">0°</text>
      <text x="145" y="195" fontSize="10" fill="var(--text-muted)" fontFamily="JetBrains Mono">Lat/Lon</text>
    </svg>
  )
}

function NeuralViz() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
      <defs>
        <style>{`
          @keyframes pulse { from { r: 3; } 50% { r: 5; } to { r: 3; } }
          .node { animation: pulse 2s ease-in-out infinite; }
        `}</style>
      </defs>
      {/* Input layer */}
      <circle cx="50" cy="60" r="4" fill="var(--green)" className="node" />
      <circle cx="50" cy="100" r="4" fill="var(--green)" className="node" style={{ animationDelay: '0.3s' }} />
      <circle cx="50" cy="140" r="4" fill="var(--green)" className="node" style={{ animationDelay: '0.6s' }} />
      {/* Hidden layer */}
      <circle cx="150" cy="50" r="4" fill="var(--green)" className="node" style={{ animationDelay: '0.2s' }} />
      <circle cx="150" cy="100" r="4" fill="var(--green)" className="node" style={{ animationDelay: '0.5s' }} />
      <circle cx="150" cy="150" r="4" fill="var(--green)" className="node" style={{ animationDelay: '0.8s' }} />
      {/* Output layer */}
      <circle cx="250" cy="100" r="4" fill="var(--green)" className="node" style={{ animationDelay: '1s' }} />
      {/* Connections */}
      <line x1="54" y1="62" x2="146" y2="52" stroke="var(--green)" strokeWidth="0.8" opacity="0.3" />
      <line x1="54" y1="102" x2="146" y2="102" stroke="var(--green)" strokeWidth="0.8" opacity="0.3" />
      <line x1="54" y1="142" x2="146" y2="152" stroke="var(--green)" strokeWidth="0.8" opacity="0.3" />
      <line x1="154" y1="52" x2="246" y2="102" stroke="var(--green)" strokeWidth="0.8" opacity="0.3" />
      <line x1="154" y1="102" x2="246" y2="102" stroke="var(--green)" strokeWidth="0.8" opacity="0.3" />
      <line x1="154" y1="152" x2="246" y2="102" stroke="var(--green)" strokeWidth="0.8" opacity="0.3" />
    </svg>
  )
}

function TreeViz() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
      <defs>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .node { animation: fadeIn 0.6s ease-out forwards; }
        `}</style>
      </defs>
      {/* Root */}
      <circle cx="150" cy="20" r="4" fill="var(--green)" className="node" />
      {/* Level 1 branches */}
      <line x1="150" y1="24" x2="100" y2="60" stroke="var(--green)" strokeWidth="1" opacity="0.5" />
      <line x1="150" y1="24" x2="200" y2="60" stroke="var(--green)" strokeWidth="1" opacity="0.5" />
      {/* Level 1 nodes */}
      <circle cx="100" cy="64" r="3" fill="var(--green)" className="node" style={{ animationDelay: '100ms' }} />
      <circle cx="200" cy="64" r="3" fill="var(--green)" className="node" style={{ animationDelay: '100ms' }} />
      {/* Level 2 branches */}
      <line x1="100" y1="67" x2="70" y2="100" stroke="var(--green)" strokeWidth="1" opacity="0.4" />
      <line x1="100" y1="67" x2="130" y2="100" stroke="var(--green)" strokeWidth="1" opacity="0.4" />
      <line x1="200" y1="67" x2="170" y2="100" stroke="var(--green)" strokeWidth="1" opacity="0.4" />
      <line x1="200" y1="67" x2="230" y2="100" stroke="var(--green)" strokeWidth="1" opacity="0.4" />
      {/* Level 2 nodes */}
      <circle cx="70" cy="104" r="2.5" fill="var(--green)" className="node" style={{ animationDelay: '200ms' }} />
      <circle cx="130" cy="104" r="2.5" fill="var(--green)" className="node" style={{ animationDelay: '200ms' }} />
      <circle cx="170" cy="104" r="2.5" fill="var(--green)" className="node" style={{ animationDelay: '200ms' }} />
      <circle cx="230" cy="104" r="2.5" fill="var(--green)" className="node" style={{ animationDelay: '200ms' }} />
    </svg>
  )
}

function WaveformViz() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
      <defs>
        <style>{`
          @keyframes wave { from { transform: translateX(-300px); } to { transform: translateX(300px); } }
          .wave { animation: wave 4s linear infinite; }
        `}</style>
      </defs>
      {/* Center line */}
      <line x1="0" y1="100" x2="300" y2="100" stroke="var(--border)" strokeWidth="1" />
      {/* Sine wave */}
      <path
        d="M 0 100 Q 20 80 40 100 T 80 100 T 120 100 T 160 100 T 200 100 T 240 100 T 280 100 T 320 100"
        fill="none"
        stroke="var(--green)"
        strokeWidth="2"
        className="wave"
      />
    </svg>
  )
}

function ModuleVisual({ moduleTitle, moduleContent }) {
  const title = (moduleTitle || '').toLowerCase()
  const content = (moduleContent || '').toLowerCase()

  if (title.includes('distribut') || title.includes('normal') || title.includes('probabilit')) {
    return <BellCurveViz />
  }
  if (title.includes('regression') || title.includes('linear')) {
    return <ScatterPlotViz />
  }
  if (title.includes('regex') || title.includes('pattern') || title.includes('expression')) {
    return <RegexViz />
  }
  if (title.includes('map') || title.includes('geo') || title.includes('spatial')) {
    return <GeoViz />
  }
  if (title.includes('neural') || title.includes('network') || title.includes('deep learn')) {
    return <NeuralViz />
  }
  if (title.includes('tree') || title.includes('decision') || title.includes('forest')) {
    return <TreeViz />
  }

  return <WaveformViz />
}

// ─── Helper Functions ───

function saveLocalProgress(courseId, moduleId, quizScore) {
  try {
    const key = `vedion_progress_${courseId}`
    const data = JSON.parse(localStorage.getItem(key) ?? '{}')
    if (!data.completedModules) data.completedModules = []
    if (!data.completedModules.includes(moduleId)) data.completedModules.push(moduleId)
    if (!data.quizScores) data.quizScores = {}
    data.quizScores[moduleId] = quizScore
    data.lastModule = moduleId
    localStorage.setItem(key, JSON.stringify(data))
  } catch (_) {}
}

async function saveServerProgress(courseId, moduleId, quizScore) {
  try {
    const { auth } = await import('../../../lib/firebase')
    const user = auth.currentUser
    if (!user) return
    const token = await user.getIdToken()
    const existing = await fetch(`/api/learn/progress?courseId=${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .catch(() => ({}))
    const completedModules = [...new Set([...(existing.completedModules ?? []), moduleId])]
    const quizScores = { ...(existing.quizScores ?? {}), [moduleId]: quizScore }
    await fetch(`/api/learn/progress?courseId=${courseId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ completedModules, quizScores, lastModule: moduleId }),
    })
  } catch (_) {}
}

function isAnswered(q, answers) {
  if (q.type === 'select-all') return answers[q.id] !== undefined
  if (q.type === 'fill-blank') return (answers[q.id] ?? '').trim().length > 0
  return answers[q.id] !== undefined
}

function isCorrect(q, answers) {
  if (q.type === 'select-all') {
    const selected = [...(answers[q.id] ?? [])].sort((a, b) => a - b)
    const correct = [...(q.answer ?? [])].sort((a, b) => a - b)
    return JSON.stringify(selected) === JSON.stringify(correct)
  }
  if (q.type === 'fill-blank') {
    const userAns = (answers[q.id] ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
    return (q.blanks ?? []).some((b) => b.trim().toLowerCase().replace(/\s+/g, ' ') === userAns)
  }
  return answers[q.id] === q.answer
}

// ─── Content Parser (simplified) ───

function inlineFormat(text) {
  // Bold **text**, inline `code`, links
  const parts = []
  let rest = text
  const patterns = [
    { re: /\*\*(.+?)\*\*/g, render: (m, i) => <strong key={i} style={{ color: 'var(--text)', fontWeight: 700 }}>{m[1]}</strong> },
    { re: /`([^`]+)`/g,     render: (m, i) => <code key={i} style={{ background: 'rgba(57,255,139,0.08)', color: 'var(--green)', fontFamily: 'JetBrains Mono', fontSize: 13, padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(57,255,139,0.2)' }}>{m[1]}</code> },
  ]
  // Simple sequential split — handles bold + code inline
  const result = []
  let remaining = text
  let key = 0
  const combined = /\*\*(.+?)\*\*|`([^`]+)`/g
  let last = 0, match
  while ((match = combined.exec(text)) !== null) {
    if (match.index > last) result.push(text.slice(last, match.index))
    if (match[0].startsWith('**')) result.push(<strong key={key++} style={{ color: 'var(--text)', fontWeight: 700 }}>{match[1]}</strong>)
    else result.push(<code key={key++} style={{ background: 'rgba(57,255,139,0.08)', color: 'var(--green)', fontFamily: 'JetBrains Mono', fontSize: 13, padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(57,255,139,0.15)' }}>{match[2]}</code>)
    last = match.index + match[0].length
  }
  if (last < text.length) result.push(text.slice(last))
  return result.length ? result : text
}

function parseContent(text) {
  const lines = text.split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    // Fenced code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim() || 'code'
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push({ type: 'code', lang, text: codeLines.join('\n') })
      i++
      continue
    }
    if (line.startsWith('### ')) { blocks.push({ type: 'h3', text: line.slice(4) }); i++; continue }
    if (line.startsWith('## '))  { blocks.push({ type: 'h2', text: line.slice(3) }); i++; continue }
    if (line.startsWith('# '))   { blocks.push({ type: 'h1', text: line.slice(2) }); i++; continue }
    if (line.startsWith('- ') || line.startsWith('* ')) { blocks.push({ type: 'li', text: line.slice(2) }); i++; continue }
    if (/^\d+\. /.test(line))    { blocks.push({ type: 'oli', text: line.replace(/^\d+\. /, '') }); i++; continue }
    if (line.trim() === '')      { blocks.push({ type: 'br' }); i++; continue }
    blocks.push({ type: 'para', text: line })
    i++
  }
  return blocks
}

function ContentBlock({ block }) {
  const body = typeof block.text === 'string' ? inlineFormat(block.text) : block.text
  switch (block.type) {
    case 'h1':
      return <h1 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 900, fontSize: 'clamp(1.5rem,3vw,2rem)', color: 'var(--text)', margin: '36px 0 14px', letterSpacing: '-0.02em' }}>{body}</h1>
    case 'h2':
      return <h2 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 'clamp(1.1rem,2.5vw,1.4rem)', color: 'var(--text)', margin: '30px 0 12px', letterSpacing: '-0.01em', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>{body}</h2>
    case 'h3':
      return <h3 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 'clamp(1rem,2vw,1.15rem)', color: 'var(--text)', margin: '22px 0 8px' }}>{body}</h3>
    case 'para':
      return <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.85, margin: '8px 0' }}>{body}</p>
    case 'li':
      return (
        <div style={{ display: 'flex', gap: 10, margin: '5px 0', paddingLeft: 8 }}>
          <span style={{ color: 'var(--green)', fontFamily: 'JetBrains Mono', fontSize: 13, marginTop: 2, flexShrink: 0 }}>-</span>
          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.75, margin: 0 }}>{body}</p>
        </div>
      )
    case 'oli':
      return <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.85, margin: '5px 0 5px 24px' }}>{body}</p>
    case 'code':
      return (
        <div style={{ margin: '18px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(57,255,139,0.15)' }}>
          {block.lang && block.lang !== 'code' && (
            <div style={{ background: 'rgba(57,255,139,0.08)', padding: '6px 14px', fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--green)', letterSpacing: '0.1em', borderBottom: '1px solid rgba(57,255,139,0.12)' }}>
              {block.lang.toUpperCase()}
            </div>
          )}
          <pre style={{ background: '#080810', padding: '16px', margin: 0, overflowX: 'auto' }}>
            <code style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#a8f0c6', lineHeight: 1.7 }}>
              {block.text}
            </code>
          </pre>
        </div>
      )
    case 'br':
      return <div style={{ height: 10 }} />
    default:
      return null
  }
}

// ─── Main Component ───

export default function ModulePage({ course, mod, modIndex, prevMod, nextMod }) {
  const [phase, setPhase] = useState(mod.isExam ? 'quiz' : 'lesson')
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loadingExp, setLoadingExp] = useState({})
  const [expError, setExpError] = useState({})
  const [readProgress, setReadProgress] = useState(0)
  const contentRef = useRef(null)
  const [flashcardMode, setFlashcardMode] = useState(false)
  const [flashcardProgress, setFlashcardProgress] = useState(null)
  const [flashcardLoaded, setFlashcardLoaded] = useState(false)
  const [userPlan, setUserPlan] = useState(null)

  // Read progress
  useEffect(() => {
    const onScroll = () => {
      if (!contentRef.current) return
      const el = contentRef.current
      const top = el.getBoundingClientRect().top
      const pct = Math.max(0, Math.min(100, ((-top + window.innerHeight * 0.3) / el.offsetHeight) * 100))
      setReadProgress(pct)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // User plan
  useEffect(() => {
    async function checkPlan() {
      try {
        const { auth } = await import('../../../lib/firebase')
        const user = auth.currentUser
        if (!user) return
        const token = await user.getIdToken()
        const res = await fetch('/api/user/me', { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const d = await res.json()
          setUserPlan(d.plan)
        }
      } catch (_) {}
    }
    checkPlan()
  }, [])

  // Load flashcard progress
  useEffect(() => {
    if (!mod?.isExam) return
    async function loadFlashcards() {
      try {
        const { auth } = await import('../../../lib/firebase')
        const user = auth.currentUser
        if (!user) {
          setFlashcardLoaded(true)
          return
        }
        const token = await user.getIdToken()
        const res = await fetch(`/api/learn/flashcards?courseId=${course.id}&examId=${mod.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setFlashcardProgress(data.progress ?? null)
      } catch (_) {
        setFlashcardProgress(null)
      }
      setFlashcardLoaded(true)
    }
    loadFlashcards()
  }, [mod?.isExam, mod?.id, course?.id])

  async function saveFlashcardProgress(updatedProgress) {
    setFlashcardProgress(updatedProgress)
    try {
      const { auth } = await import('../../../lib/firebase')
      const user = auth.currentUser
      if (!user) return
      const token = await user.getIdToken()
      await fetch('/api/learn/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId: course.id, examId: mod.id, progress: updatedProgress }),
      })
    } catch (_) {}
  }

  const quiz = mod.quiz ?? []
  const answered = quiz.filter((q) => isAnswered(q, answers)).length
  const allAnswered = answered === quiz.length
  const score = quiz.filter((q) => isCorrect(q, answers)).length
  const blocks = parseContent(mod.content ?? '')
  const totalMods = course.modules.length

  function handleAnswer(qId, value) {
    setAnswers((a) => ({ ...a, [qId]: value }))
  }

  async function submitQuiz() {
    setSubmitted(true)
    const s = quiz.filter((q) => isCorrect(q, answers)).length
    const quizScore = { score: s, total: quiz.length }
    saveLocalProgress(course.id, mod.id, quizScore)
    await saveServerProgress(course.id, mod.id, quizScore)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <Head>
        <title>
          {mod.title} — {course.title}
        </title>
      </Head>

      {/* Progress bar */}
      {!mod.isExam && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'rgba(255,255,255,0.05)',
            zIndex: 200,
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'var(--green)',
              width: `${readProgress}%`,
              transition: 'width 0.1s linear',
            }}
          />
        </div>
      )}

      {/* Nav */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px clamp(1rem,4vw,2rem)',
          background: 'rgba(4,4,10,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${mod.isExam ? 'rgba(255,184,0,0.15)' : 'var(--border)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href={`/learn/${course.id}`}
            style={{
              fontFamily: 'JetBrains Mono,monospace',
              fontSize: 10,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              letterSpacing: '0.15em',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            ← {course.title.split(':')[0].trim()}
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>/</span>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: mod.isExam ? 'var(--amber)' : 'var(--text-dim)', letterSpacing: '0.1em' }}>
            {mod.title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono,monospace',
              fontSize: 9,
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
            }}
          >
            {modIndex + 1} / {totalMods}
          </span>
          {phase === 'lesson' && quiz.length > 0 && (
            <button
              onClick={() => setPhase('quiz')}
              style={{
                background: 'var(--green)',
                color: '#000',
                border: 'none',
                borderRadius: 5,
                padding: '6px 14px',
                fontFamily: 'JetBrains Mono,monospace',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                cursor: 'pointer',
              }}
            >
              {mod.isExam ? 'START EXAM' : 'TAKE QUIZ'}
            </button>
          )}
          <LearnAccountButton />
        </div>
      </nav>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: '2rem', padding: 'clamp(2rem,5vw,3rem) clamp(1rem,4vw,2rem)', maxWidth: 1200, margin: '0 auto' }}>
        {/* LEFT: Visualization */}
        {phase === 'lesson' && !mod.isExam && (
          <div style={{ position: 'sticky', top: 100, height: 'fit-content' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, minHeight: 320 }}>
              <ModuleVisual moduleTitle={mod.title} moduleContent={mod.content} />
            </div>
          </div>
        )}

        {/* RIGHT: Content */}
        <div ref={contentRef}>
          {/* Header */}
          <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid var(--border)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              {mod.isExam ? (
                <span
                  style={{
                    fontFamily: 'JetBrains Mono,monospace',
                    fontSize: 10,
                    color: 'var(--amber)',
                    letterSpacing: '0.2em',
                    background: 'rgba(255,184,0,0.08)',
                    border: '1px solid rgba(255,184,0,0.25)',
                    padding: '4px 12px',
                    borderRadius: 4,
                  }}
                >
                  EXAM CHECKPOINT
                </span>
              ) : (
                <span
                  style={{
                    fontFamily: 'JetBrains Mono,monospace',
                    fontSize: 10,
                    color: 'var(--green)',
                    letterSpacing: '0.2em',
                    background: 'rgba(57,255,139,0.08)',
                    border: '1px solid rgba(57,255,139,0.2)',
                    padding: '3px 10px',
                    borderRadius: 4,
                  }}
                >
                  MODULE {String(modIndex + 1).padStart(2, '0')}
                </span>
              )}
              {mod.suggestedMinutes && (
                <span
                  style={{
                    fontFamily: 'JetBrains Mono,monospace',
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.1em',
                  }}
                >
                  ~{mod.suggestedMinutes} MIN
                </span>
              )}
              {quiz.length > 0 && (
                <span
                  style={{
                    fontFamily: 'JetBrains Mono,monospace',
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.1em',
                  }}
                >
                  {quiz.length} QUESTIONS
                </span>
              )}
            </div>
            <h1
              style={{
                fontFamily: 'Inter,sans-serif',
                fontWeight: 900,
                fontSize: 'clamp(1.8rem,4vw,2.4rem)',
                margin: '0 0 14px',
                letterSpacing: '-0.02em',
              }}
            >
              {mod.title}
            </h1>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {course.modules.map((m, i) => (
                <Link key={m.id} href={`/learn/${course.id}/${m.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    title={m.title}
                    style={{
                      height: m.isExam ? 5 : 3,
                      width: i === modIndex ? 24 : 12,
                      borderRadius: 2,
                      background: m.isExam
                        ? i === modIndex
                          ? 'var(--amber)'
                          : 'rgba(255,184,0,0.3)'
                        : i < modIndex
                          ? 'var(--green)'
                          : i === modIndex
                            ? 'var(--green)'
                            : 'rgba(255,255,255,0.1)',
                      opacity: i === modIndex ? 1 : 0.5,
                      transition: 'all 0.3s',
                      cursor: 'pointer',
                    }}
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Lesson phase */}
          {phase === 'lesson' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {blocks.map((block, i) => (
                  <ContentBlock key={i} block={block} />
                ))}
              </div>
              <div
                style={{
                  marginTop: 48,
                  paddingTop: 32,
                  borderTop: 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div>
                  {prevMod && (
                    <Link href={`/learn/${course.id}/${prevMod.id}`} style={{ textDecoration: 'none' }}>
                      <button
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)',
                          borderRadius: 7,
                          padding: '10px 18px',
                          fontFamily: 'JetBrains Mono,monospace',
                          fontSize: 11,
                          cursor: 'pointer',
                          letterSpacing: '0.1em',
                        }}
                      >
                        ← PREV
                      </button>
                    </Link>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {quiz.length > 0 ? (
                    <button
                      onClick={() => setPhase('quiz')}
                      style={{
                        background: 'var(--green)',
                        color: '#000',
                        border: 'none',
                        borderRadius: 7,
                        padding: '12px 24px',
                        fontFamily: 'JetBrains Mono,monospace',
                        fontWeight: 900,
                        fontSize: 12,
                        letterSpacing: '0.1em',
                        cursor: 'pointer',
                      }}
                    >
                      TAKE QUIZ ({quiz.length}q) →
                    </button>
                  ) : nextMod ? (
                    <Link href={`/learn/${course.id}/${nextMod.id}`} style={{ textDecoration: 'none' }}>
                      <button
                        style={{
                          background: 'var(--green)',
                          color: '#000',
                          border: 'none',
                          borderRadius: 7,
                          padding: '12px 24px',
                          fontFamily: 'JetBrains Mono,monospace',
                          fontWeight: 900,
                          fontSize: 12,
                          letterSpacing: '0.1em',
                          cursor: 'pointer',
                        }}
                      >
                        NEXT MODULE →
                      </button>
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Exam intro */}
          {!flashcardMode && mod.isExam && phase === 'lesson' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div
                style={{
                  fontFamily: 'JetBrains Mono,monospace',
                  fontSize: 9,
                  letterSpacing: '0.2em',
                  color: 'var(--text-muted)',
                  marginBottom: 16,
                }}
              >
                READY TO TEST YOUR KNOWLEDGE?
              </div>
              <button
                onClick={() => setPhase('quiz')}
                style={{
                  background: 'var(--amber)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 8,
                  padding: '14px 32px',
                  fontFamily: 'JetBrains Mono,monospace',
                  fontWeight: 900,
                  fontSize: 13,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                }}
              >
                START EXAM →
              </button>
            </div>
          )}

          {/* Quiz phase (simplified) */}
          {!flashcardMode && phase === 'quiz' && !submitted && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 28,
                  padding: '14px 18px',
                  background: mod.isExam ? 'rgba(255,184,0,0.03)' : 'rgba(255,255,255,0.02)',
                  borderRadius: 10,
                  border: `1px solid ${mod.isExam ? 'rgba(255,184,0,0.12)' : 'var(--border)'}`,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono,monospace',
                      fontSize: 9,
                      color: mod.isExam ? 'var(--amber)' : 'var(--green)',
                      letterSpacing: '0.2em',
                      marginBottom: 4,
                    }}
                  >
                    {mod.isExam ? 'EXAM CHECKPOINT' : 'QUIZ'}
                  </div>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 16 }}>{mod.title}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono,monospace',
                      fontSize: 18,
                      fontWeight: 700,
                      color: answered === quiz.length ? 'var(--green)' : 'var(--text)',
                    }}
                  >
                    {answered}
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>/{quiz.length}</span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono,monospace',
                      fontSize: 9,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    ANSWERED
                  </div>
                </div>
              </div>


              {/* Questions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 28 }}>
                {quiz.map((q, qi) => {
                  const qId = q.id ?? `q${qi}`
                  const isMulti = q.type === 'multi'
                  return (
                    <div
                      key={qId}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '20px 22px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>
                          Q{qi + 1}
                        </span>
                        <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 15, color: 'var(--text)', lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
                          {q.question}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 24 }}>
                        {(q.options ?? []).map((opt, oi) => {
                          const optId = opt.id ?? `opt${oi}`
                          const sel = isMulti
                            ? Array.isArray(answers[qId]) && answers[qId].includes(optId)
                            : answers[qId] === optId
                          return (
                            <button
                              key={optId}
                              onClick={() => {
                                if (isMulti) {
                                  const prev = Array.isArray(answers[qId]) ? answers[qId] : []
                                  setAnswers(a => ({
                                    ...a,
                                    [qId]: sel ? prev.filter(x => x !== optId) : [...prev, optId],
                                  }))
                                } else {
                                  setAnswers(a => ({ ...a, [qId]: optId }))
                                }
                              }}
                              style={{
                                textAlign: 'left',
                                background: sel ? 'rgba(57,255,139,0.1)' : 'rgba(255,255,255,0.02)',
                                border: sel ? '1px solid var(--green)' : '1px solid var(--border)',
                                borderRadius: 7,
                                padding: '11px 16px',
                                fontFamily: 'Inter,sans-serif',
                                fontSize: 14,
                                color: sel ? 'var(--green)' : 'var(--text-dim)',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                width: '100%',
                              }}
                            >
                              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, marginRight: 10, opacity: 0.5 }}>
                                {String.fromCharCode(65 + oi)}
                              </span>
                              {opt.text ?? opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={submitQuiz}
                disabled={!allAnswered}
                style={{
                  marginTop: 28,
                  background: allAnswered ? (mod.isExam ? 'var(--amber)' : 'var(--green)') : 'rgba(255,255,255,0.05)',
                  color: allAnswered ? '#000' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 7,
                  padding: '12px 28px',
                  fontFamily: 'JetBrains Mono,monospace',
                  fontWeight: 900,
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  cursor: allAnswered ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                {mod.isExam ? 'SUBMIT EXAM' : 'SUBMIT → SCORE'}
              </button>
            </div>
          )}

          {/* Results phase */}
          {!flashcardMode && phase === 'quiz' && submitted && (
            <div>
              <div
                style={{
                  padding: '28px 24px',
                  borderRadius: 14,
                  border: `1px solid ${
                    score === quiz.length
                      ? 'rgba(57,255,139,0.3)'
                      : score >= (quiz.length * 0.7) ? 'rgba(255,184,0,0.3)' : 'rgba(255,45,85,0.3)'
                  }`,
                  background:
                    score === quiz.length
                      ? 'rgba(57,255,139,0.04)'
                      : score >= (quiz.length * 0.7)
                        ? 'rgba(255,184,0,0.04)'
                        : 'rgba(255,45,85,0.04)',
                  marginBottom: 28,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: 'JetBrains Mono,monospace',
                    fontSize: 9,
                    letterSpacing: '0.25em',
                    color: 'var(--text-muted)',
                    marginBottom: 12,
                  }}
                >
                  {mod.isExam ? 'EXAM COMPLETE' : 'QUIZ COMPLETE'}
                </div>
                <div
                  style={{
                    fontFamily: 'Inter,sans-serif',
                    fontWeight: 900,
                    fontSize: 'clamp(2.5rem,8vw,4rem)',
                    letterSpacing: '-0.04em',
                    color:
                      score === quiz.length
                        ? 'var(--green)'
                        : score >= (quiz.length * 0.7)
                          ? 'var(--amber)'
                          : '#FF2D55',
                    lineHeight: 1,
                  }}
                >
                  {score}
                  <span style={{ fontSize: '0.4em', opacity: 0.5, fontWeight: 400 }}>/{quiz.length}</span>
                </div>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono,monospace',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginTop: 8,
                    letterSpacing: '0.1em',
                  }}
                >
                  {score === quiz.length ? 'PERFECT' : score >= (quiz.length * 0.7) ? 'GOOD WORK' : 'KEEP STUDYING'} · {Math.round((score / quiz.length) * 100)}%
                </div>
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {nextMod && (
                  <Link href={`/learn/${course.id}/${nextMod.id}`} style={{ textDecoration: 'none' }}>
                    <button
                      style={{
                        background: 'var(--green)',
                        color: '#000',
                        border: 'none',
                        borderRadius: 7,
                        padding: '12px 24px',
                        fontFamily: 'JetBrains Mono,monospace',
                        fontWeight: 900,
                        fontSize: 12,
                        letterSpacing: '0.1em',
                        cursor: 'pointer',
                      }}
                    >
                      NEXT: {nextMod.title} →
                    </button>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setPhase('quiz')
                    setSubmitted(false)
                    setAnswers({})
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    borderRadius: 7,
                    padding: '12px 18px',
                    fontFamily: 'JetBrains Mono,monospace',
                    fontSize: 11,
                    cursor: 'pointer',
                    letterSpacing: '0.1em',
                  }}
                >
                  ↺ RETRY
                </button>
                <Link href={`/learn/${course.id}`} style={{ textDecoration: 'none' }}>
                  <button
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: 'var(--text-muted)',
                      borderRadius: 7,
                      padding: '12px 18px',
                      fontFamily: 'JetBrains Mono,monospace',
                      fontSize: 11,
                      cursor: 'pointer',
                      letterSpacing: '0.1em',
                    }}
                  >
                    ← COURSE
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: minmax(280px, 1fr) 2fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
