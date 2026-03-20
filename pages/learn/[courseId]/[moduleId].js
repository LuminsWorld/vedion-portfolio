import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getCourse } from '../../../lib/courseData'

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
  const nextMod  = course.modules[modIndex + 1] ?? null
  return { props: { course, mod, nextMod } }
}

function saveLocalProgress(courseId, moduleId, quizScore) {
  try {
    const key  = `vedion_progress_${courseId}`
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
    // Fetch existing, merge, save
    const existing = await fetch(`/api/learn/progress?courseId=${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).catch(() => ({}))
    const completedModules = [...new Set([...(existing.completedModules ?? []), moduleId])]
    const quizScores = { ...(existing.quizScores ?? {}), [moduleId]: quizScore }
    await fetch(`/api/learn/progress?courseId=${courseId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ completedModules, quizScores, lastModule: moduleId }),
    })
  } catch (_) {}
}

// Simple markdown renderer (headers, bold, bullets, code)
function renderContent(text) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (line.startsWith('### ')) return <h3 key={i} style={cs.h3}>{line.slice(4)}</h3>
    if (line.startsWith('## '))  return <h2 key={i} style={cs.h2}>{line.slice(3)}</h2>
    if (line.startsWith('# '))   return <h1 key={i} style={cs.h1}>{line.slice(2)}</h1>
    if (line.startsWith('- '))   return <li key={i} style={cs.li}>{line.slice(2)}</li>
    if (line.startsWith('```'))  return null
    if (line.trim() === '')      return <br key={i} />
    // Inline bold
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    return (
      <p key={i} style={cs.p}>
        {parts.map((part, j) =>
          part.startsWith('**') ? <strong key={j} style={{ color: '#fff' }}>{part.slice(2, -2)}</strong> : part
        )}
      </p>
    )
  })
}

export default function ModulePage({ course, mod, nextMod }) {
  const router = useRouter()
  const [phase, setPhase]       = useState('lesson')   // 'lesson' | 'quiz' | 'results'
  const [answers, setAnswers]   = useState({})          // { qId: optionIndex }
  const [submitted, setSubmitted] = useState(false)
  const [explanations, setExplanations] = useState({}) // { qId: string }
  const [loadingExp, setLoadingExp]     = useState({})  // { qId: bool }
  const [expError, setExpError]         = useState({})  // { qId: string }
  const [userPlan, setUserPlan] = useState(null)

  useEffect(() => {
    // Check user plan for AI feature gate
    async function checkPlan() {
      try {
        const { auth } = await import('../../../lib/firebase')
        const user = auth.currentUser
        if (!user) return
        const token = await user.getIdToken()
        const res = await fetch('/api/user/me', { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) { const d = await res.json(); setUserPlan(d.plan) }
      } catch (_) {}
    }
    checkPlan()
  }, [])

  const quiz      = mod.quiz ?? []
  const answered  = Object.keys(answers).length
  const allAnswered = answered === quiz.length

  function selectAnswer(qId, idx) {
    if (submitted) return
    setAnswers(a => ({ ...a, [qId]: idx }))
  }

  async function submitQuiz() {
    setSubmitted(true)
    const score = quiz.filter(q => answers[q.id] === q.answer).length
    const quizScore = { score, total: quiz.length, attempts: 1 }
    saveLocalProgress(course.id, mod.id, quizScore)
    await saveServerProgress(course.id, mod.id, quizScore)
  }

  async function getAIExplanation(q) {
    setLoadingExp(l => ({ ...l, [q.id]: true }))
    setExpError(e => ({ ...e, [q.id]: '' }))
    try {
      const { auth } = await import('../../../lib/firebase')
      const user = auth.currentUser
      if (!user) throw new Error('Sign in to use AI explanations.')
      const token = await user.getIdToken()
      const res = await fetch('/api/learn/explain', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId:     course.id,
          moduleId:     mod.id,
          question:     q.question,
          wrongAnswer:  q.options?.[answers[q.id]],
          correctAnswer: q.options?.[q.answer] ?? String(q.answer),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setExplanations(e => ({ ...e, [q.id]: data.explanation }))
    } catch (e) {
      setExpError(err => ({ ...err, [q.id]: e.message }))
    } finally {
      setLoadingExp(l => ({ ...l, [q.id]: false }))
    }
  }

  const score = quiz.filter(q => answers[q.id] === q.answer).length
  const isPro = ['pro', 'ultra'].includes(userPlan)

  return (
    <div style={s.root}>
      <Head><title>{mod.title} — {course.title}</title></Head>
      <div style={s.container}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 32 }}>
          <Link href="/learn" style={s.crumb}>LEARN</Link>
          <span style={s.crumbSep}>/</span>
          <Link href={`/learn/${course.id}`} style={s.crumb}>{course.id.toUpperCase()}</Link>
          <span style={s.crumbSep}>/</span>
          <span style={{ ...s.crumb, color: 'rgba(255,255,255,0.6)' }}>{mod.title}</span>
        </div>

        {/* ── Lesson phase ── */}
        {phase === 'lesson' && (
          <>
            <h1 style={s.modTitle}>{mod.title}</h1>
            <div style={s.lessonContent}>{renderContent(mod.content)}</div>
            {quiz.length > 0 && (
              <button style={s.ctaBtn} onClick={() => setPhase('quiz')}>
                TAKE QUIZ ({quiz.length} questions) →
              </button>
            )}
            {quiz.length === 0 && (
              <button style={s.ctaBtn} onClick={async () => {
                saveLocalProgress(course.id, mod.id, { score: 0, total: 0 })
                await saveServerProgress(course.id, mod.id, { score: 0, total: 0 })
                if (nextMod) router.push(`/learn/${course.id}/${nextMod.id}`)
                else router.push(`/learn/${course.id}`)
              }}>MARK COMPLETE {nextMod ? '→' : '· FINISH'}</button>
            )}
          </>
        )}

        {/* ── Quiz phase ── */}
        {phase === 'quiz' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'monospace', fontSize: 14, letterSpacing: 2, color: 'rgba(255,255,255,0.5)', margin: 0 }}>QUIZ — {mod.title}</h2>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{answered}/{quiz.length} answered</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {quiz.map((q, qi) => {
                const chosen   = answers[q.id]
                const correct  = submitted && chosen === q.answer
                const wrong    = submitted && chosen !== q.answer
                return (
                  <div key={q.id} style={{ ...s.qCard, borderColor: submitted ? (correct ? 'rgba(0,255,65,0.2)' : wrong ? 'rgba(255,45,85,0.2)' : 'rgba(255,255,255,0.06)') : 'rgba(255,255,255,0.06)' }}>
                    <p style={s.qNum}>Q{qi + 1}</p>
                    <p style={s.qText}>{q.question}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {q.options.map((opt, oi) => {
                        const isChosen  = chosen === oi
                        const isCorrect = submitted && oi === q.answer
                        const isWrong   = submitted && isChosen && oi !== q.answer
                        return (
                          <button key={oi} onClick={() => selectAnswer(q.id, oi)}
                            style={{ ...s.optBtn,
                              borderColor: isCorrect ? '#00FF41' : isWrong ? '#FF2D55' : isChosen ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.07)',
                              background:  isCorrect ? 'rgba(0,255,65,0.08)' : isWrong ? 'rgba(255,45,85,0.08)' : isChosen ? 'rgba(255,255,255,0.04)' : 'transparent',
                              color:       isCorrect ? '#00FF41' : isWrong ? '#FF2D55' : '#fff',
                              cursor:      submitted ? 'default' : 'pointer',
                            }}>
                            <span style={{ ...s.optLetter, borderColor: isCorrect ? '#00FF41' : isWrong ? '#FF2D55' : isChosen ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)', color: isCorrect ? '#00FF41' : isWrong ? '#FF2D55' : 'rgba(255,255,255,0.5)' }}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                          </button>
                        )
                      })}
                    </div>

                    {/* Wrong answer actions */}
                    {wrong && (
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>

                        {/* Review module button — always available */}
                        <button style={s.reviewBtn} onClick={() => setPhase('lesson')}>
                          ↩ Review this module
                        </button>

                        {/* AI Explain — Pro/Ultra only */}
                        {isPro ? (
                          explanations[q.id] ? (
                            <div style={s.explanationBox}>
                              <p style={s.explainLabel}>✦ AI EXPLANATION</p>
                              <p style={s.explainText}>{explanations[q.id]}</p>
                            </div>
                          ) : (
                            <button style={s.aiBtn} disabled={loadingExp[q.id]} onClick={() => getAIExplanation(q)}>
                              {loadingExp[q.id] ? '✦ Thinking...' : '✦ Explain with AI'}
                            </button>
                          )
                        ) : (
                          <div style={s.upgradeHint}>
                            <span>✦ AI explanations — </span>
                            <Link href="/app" style={{ color: '#7B2FFF', textDecoration: 'none' }}>Pro/Ultra only</Link>
                          </div>
                        )}

                        {expError[q.id] && <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#FF2D55', margin: 0 }}>{expError[q.id]}</p>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {!submitted ? (
              <button style={{ ...s.ctaBtn, marginTop: 32, opacity: allAnswered ? 1 : 0.3 }}
                onClick={submitQuiz} disabled={!allAnswered}>
                SUBMIT QUIZ
              </button>
            ) : (
              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                <p style={{ fontFamily: 'monospace', fontSize: 18, color: score === quiz.length ? '#00FF41' : '#FFB800', margin: 0, letterSpacing: 1 }}>
                  {score}/{quiz.length} CORRECT
                </p>
                {nextMod && (
                  <Link href={`/learn/${course.id}/${nextMod.id}`} style={{ textDecoration: 'none' }}>
                    <button style={s.ctaBtn}>NEXT MODULE: {nextMod.title} →</button>
                  </Link>
                )}
                <Link href={`/learn/${course.id}`} style={{ textDecoration: 'none' }}>
                  <button style={{ ...s.ctaBtn, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                    ← BACK TO COURSE
                  </button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Content styles
const cs = {
  h1: { fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 26, color: '#fff', margin: '24px 0 12px' },
  h2: { fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff', margin: '20px 0 8px' },
  h3: { fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 16, color: '#00FF41', margin: '16px 0 6px' },
  p:  { fontFamily: 'Inter, sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '4px 0' },
  li: { fontFamily: 'Inter, sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginLeft: 20 },
}

const s = {
  root:          { background: '#000', minHeight: '100vh', color: '#fff' },
  container:     { maxWidth: 720, margin: '0 auto', padding: '48px 24px' },
  crumb:         { fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textDecoration: 'none' },
  crumbSep:      { color: 'rgba(255,255,255,0.15)', fontSize: 12 },
  modTitle:      { fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 28, margin: '0 0 32px' },
  lessonContent: { marginBottom: 40 },
  ctaBtn:        { background: '#00FF41', color: '#000', border: 'none', borderRadius: 8, padding: '12px 24px', fontFamily: 'monospace', fontWeight: 900, fontSize: 13, letterSpacing: 1, cursor: 'pointer' },
  qCard:         { background: '#0A0A0A', border: '1px solid', borderRadius: 10, padding: 18 },
  qNum:          { fontFamily: 'monospace', fontSize: 10, color: '#00FF41', letterSpacing: 2, margin: '0 0 6px' },
  qText:         { fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16, color: '#fff', margin: '0 0 14px', lineHeight: 1.5 },
  optBtn:        { display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: '1px solid', borderRadius: 8, padding: '10px 14px', textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: 14, transition: 'all 0.15s', width: '100%' },
  optLetter:     { width: 22, height: 22, borderRadius: 4, border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 10, fontWeight: 700, flexShrink: 0 },
  reviewBtn:     { background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: '8px 14px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', letterSpacing: 1, textAlign: 'left' },
  aiBtn:         { background: 'rgba(123,47,255,0.1)', border: '1px solid rgba(123,47,255,0.3)', borderRadius: 7, padding: '8px 14px', fontFamily: 'monospace', fontSize: 11, color: '#7B2FFF', cursor: 'pointer', letterSpacing: 1, textAlign: 'left' },
  upgradeHint:   { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.25)', padding: '6px 0' },
  explanationBox: { background: 'rgba(123,47,255,0.06)', border: '1px solid rgba(123,47,255,0.2)', borderRadius: 8, padding: '12px 14px' },
  explainLabel:  { fontFamily: 'monospace', fontSize: 9, letterSpacing: 2, color: '#7B2FFF', margin: '0 0 6px' },
  explainText:   { fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 },
}
