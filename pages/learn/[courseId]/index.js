import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getCourse } from '../../../lib/courseData'
import LearnAccountButton from '../../../components/LearnAccountButton'

export async function getStaticPaths() {
  const { getAllCourses } = await import('../../../lib/courseData')
  return { paths: getAllCourses().map(c => ({ params: { courseId: c.id } })), fallback: false }
}

export async function getStaticProps({ params }) {
  const course = getCourse(params.courseId)
  if (!course) return { notFound: true }
  return { props: { course } }
}

function getLocalProgress(courseId) {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(`vedion_progress_${courseId}`) ?? '{}') } catch { return {} }
}

export default function CoursePage({ course }) {
  const [progress, setProgress] = useState({})

  useEffect(() => {
    // Try Firestore first (if logged in), fall back to localStorage
    async function load() {
      try {
        const { auth } = await import('../../../lib/firebase')
        const user = auth.currentUser
        if (user) {
          const token = await user.getIdToken()
          const res = await fetch(`/api/learn/progress?courseId=${course.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) { setProgress(await res.json()); return }
        }
      } catch (_) {}
      setProgress(getLocalProgress(course.id))
    }
    load()
  }, [course.id])

  const completed   = progress.completedModules ?? []
  const totalMods   = course.modules.length
  const donePct     = totalMods ? Math.round((completed.length / totalMods) * 100) : 0

  return (
    <div style={s.root}>
      <Head><title>{course.title} — Vedion Learn</title></Head>
      <div style={s.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <Link href="/learn" style={{ ...s.back, textDecoration: 'none' }}>← ALL COURSES</Link>
          <LearnAccountButton />
        </div>

        <div style={s.header}>
          <p style={s.courseId}>{course.id.toUpperCase()}</p>
          <h1 style={s.title}>{course.title}</h1>
          <p style={s.desc}>{course.description}</p>

          {/* Progress bar */}
          <div style={s.progressWrap}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={s.progressLabel}>PROGRESS</span>
              <span style={s.progressLabel}>{completed.length}/{totalMods} modules · {donePct}%</span>
            </div>
            <div style={s.progressTrack}>
              <div style={{ ...s.progressFill, width: `${donePct}%` }} />
            </div>
          </div>
        </div>

        <div style={s.moduleList}>
          {(() => { let modNum = 0; return course.modules.map((mod, i) => {
            if (!mod.isExam) modNum++
            const displayNum = modNum
            const done  = completed.includes(mod.id)
            const score = progress.quizScores?.[mod.id]
            const isNext = !done && (i === 0 || completed.includes(course.modules[i - 1]?.id))
            const isExam = mod.isExam
            const isFinal = isExam && mod.examKind === 'final'
            const examC  = isFinal ? '#A855F7' : '#FFB800'
            const examBg = isFinal ? 'rgba(168,85,247,0.03)' : 'rgba(255,184,0,0.03)'
            const examBorder = (a) => isFinal ? `rgba(168,85,247,${a})` : `rgba(255,184,0,${a})`
            const examBadgeLabel = isFinal ? 'FINAL' : 'CHECKPOINT'
            return (
              <Link key={mod.id} href={`/learn/${course.id}/${mod.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ ...s.moduleRow, borderColor: isExam ? (done ? examBorder(0.35) : examBorder(0.15)) : done ? 'rgba(0,255,65,0.2)' : isNext ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', background: isExam ? examBg : '#0A0A0A' }}>
                  <div style={{ ...s.modNum, background: isExam ? (done ? examC : examBorder(0.12)) : done ? '#00FF41' : isNext ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', color: isExam ? (done ? '#000' : examC) : done ? '#000' : isNext ? '#fff' : 'rgba(255,255,255,0.2)', borderRadius: isExam ? 6 : '50%', fontSize: isExam ? 9 : 11 }}>
                    {isExam ? (done ? '+' : '!') : (done ? '+' : displayNum)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ ...s.modTitle, color: isExam ? examC : done ? '#fff' : isNext ? '#fff' : 'rgba(255,255,255,0.35)', margin: 0 }}>{mod.title}</p>
                      {isExam && <span style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.15em', color: examC, background: examBorder(0.1), border: `1px solid ${examBorder(0.2)}`, padding: '2px 6px', borderRadius: 3 }}>{examBadgeLabel}</span>}
                    </div>
                    <p style={s.modMeta}>{isExam ? `${mod.quiz?.length ?? 0} exam questions${mod.suggestedMinutes ? ` · ~${mod.suggestedMinutes} min` : ''}` : `${mod.quiz?.length ?? 0} quiz questions`}{score ? ` · Last score: ${score.score}/${score.total}` : ''}</p>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: done ? '#00FF41' : 'rgba(255,255,255,0.15)' }}>
                    {done ? 'DONE' : isNext ? '→' : ''}
                  </span>
                </div>
              </Link>
            )
          })})()}
        </div>
      </div>
    </div>
  )
}

const s = {
  root:          { background: '#000', minHeight: '100vh', color: '#fff' },
  container:     { maxWidth: 720, margin: '0 auto', padding: '48px 24px' },
  back:          { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 2 },
  header:        { margin: '24px 0 40px' },
  courseId:      { fontFamily: 'monospace', fontSize: 10, color: '#00FF41', letterSpacing: 3, margin: '0 0 8px' },
  title:         { fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 28, margin: '0 0 8px', color: '#fff' },
  desc:          { fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 24px' },
  progressWrap:  { marginTop: 8 },
  progressLabel: { fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },
  progressTrack: { height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', background: '#00FF41', borderRadius: 2, transition: 'width 0.4s ease' },
  moduleList:    { display: 'flex', flexDirection: 'column', gap: 8 },
  moduleRow:     { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#0A0A0A', border: '1px solid', borderRadius: 10, cursor: 'pointer' },
  modNum:        { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, flexShrink: 0 },
  modTitle:      { fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, margin: '0 0 2px' },
  modMeta:       { fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: 0 },
}
