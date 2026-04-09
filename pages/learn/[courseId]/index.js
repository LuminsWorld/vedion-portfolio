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

// SVG Icons
function DiagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="5" cy="5" r="1.5" fill="currentColor" />
      <circle cx="15" cy="5" r="1.5" fill="currentColor" />
      <circle cx="10" cy="15" r="1.5" fill="currentColor" />
      <line x1="5" y1="6.5" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" />
      <line x1="15" y1="6.5" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function TextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="3" width="16" height="2" rx="1" />
      <rect x="2" y="7" width="16" height="2" rx="1" />
      <rect x="2" y="11" width="16" height="2" rx="1" />
      <rect x="2" y="15" width="10" height="2" rx="1" />
    </svg>
  )
}

function QuizIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="5" r="1" fill="currentColor" />
      <line x1="8" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="10" r="1" fill="currentColor" />
      <line x1="8" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="15" r="1" fill="currentColor" />
      <line x1="8" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export default function CoursePage({ course }) {
  const [progress, setProgress] = useState({})

  useEffect(() => {
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

  const completed = progress.completedModules ?? []
  const totalMods = course.modules.length
  const donePct = totalMods ? Math.round((completed.length / totalMods) * 100) : 0

  return (
    <div style={s.root}>
      <Head><title>{course.title} — Vedion Learn</title></Head>
      <div style={s.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
          <Link href="/learn" style={{ ...s.back, textDecoration: 'none' }}>← ALL COURSES</Link>
          <LearnAccountButton />
        </div>

        {/* Hero section */}
        <div style={s.hero}>
          {/* Cover image or fallback */}
          <div
            style={{
              width: '100%',
              height: 240,
              background: `linear-gradient(135deg, var(--green-dim), rgba(75,16,160,0.15))`,
              borderRadius: 12,
              marginBottom: 32,
              backgroundImage: `url(/assets/gen/course_${course.id}.png)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(4,4,10,0.4)',
                borderRadius: 12,
                pointerEvents: 'none',
              }}
            />
          </div>

          <p style={s.courseId}>{course.id.toUpperCase()}</p>
          <h1 style={s.title}>{course.title}</h1>
          <p style={s.desc}>{course.description}</p>

          {/* Progress bar */}
          <div style={s.progressWrap}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={s.progressLabel}>PROGRESS</span>
              <span style={s.progressLabel}>{completed.length}/{totalMods} modules · {donePct}%</span>
            </div>
            <div style={s.progressTrack}>
              <div style={{ ...s.progressFill, width: `${donePct}%` }} />
            </div>
          </div>
        </div>

        {/* Module list */}
        <div style={s.moduleList}>
          {course.modules.map((mod, i) => {
            const done = completed.includes(mod.id)
            const score = progress.quizScores?.[mod.id]
            const isNext = !done && (i === 0 || completed.includes(course.modules[i - 1]?.id))
            const isExam = mod.isExam
            return (
              <Link key={mod.id} href={`/learn/${course.id}/${mod.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    ...s.moduleRow,
                    borderColor: isExam
                      ? done
                        ? 'rgba(255,184,0,0.35)'
                        : 'rgba(255,184,0,0.15)'
                      : done
                        ? 'rgba(57,255,139,0.2)'
                        : isNext
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(255,255,255,0.04)',
                    background: isExam ? 'rgba(255,184,0,0.03)' : 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Type indicator */}
                    <div
                      style={{
                        color: isExam ? '#FFB800' : done ? 'var(--green)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isExam ? <QuizIcon /> : mod.isReading ? <TextIcon /> : <DiagramIcon />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p
                          style={{
                            ...s.modTitle,
                            color: isExam ? '#FFB800' : done ? 'var(--text)' : isNext ? 'var(--text)' : 'var(--text-muted)',
                            margin: 0,
                          }}
                        >
                          {mod.title}
                        </p>
                        {isExam && (
                          <span
                            style={{
                              fontFamily: 'JetBrains Mono',
                              fontSize: 8,
                              letterSpacing: '0.15em',
                              color: '#FFB800',
                              background: 'rgba(255,184,0,0.1)',
                              border: '1px solid rgba(255,184,0,0.2)',
                              padding: '2px 6px',
                              borderRadius: 3,
                              textTransform: 'uppercase',
                            }}
                          >
                            Checkpoint
                          </span>
                        )}
                      </div>
                      <p style={s.modMeta}>
                        {isExam
                          ? `${mod.quiz?.length ?? 0} exam questions${mod.suggestedMinutes ? ` · ~${mod.suggestedMinutes} min` : ''}`
                          : `${mod.quiz?.length ?? 0} quiz questions`}
                        {score ? ` · Last score: ${score.score}/${score.total}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Completion indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    {done && (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--green)">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                    {!done && isNext && (
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-dim)' }}>→</span>
                    )}
                    {!done && !isNext && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        style={{ opacity: 0.3, color: 'var(--text)' }}
                        fill="currentColor"
                      >
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                      </svg>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const s = {
  root: { background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' },
  container: { maxWidth: 800, margin: '0 auto', padding: '48px 24px' },
  back: { fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2 },
  hero: { marginBottom: 48 },
  courseId: { fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--green)', letterSpacing: 3, margin: '0 0 8px', textTransform: 'uppercase' },
  title: { fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 2.8rem)', margin: '0 0 8px', color: 'var(--text)', letterSpacing: '-0.02em' },
  desc: { fontFamily: 'Inter, sans-serif', fontSize: 15, color: 'var(--text-dim)', margin: '0 0 24px' },
  progressWrap: { marginTop: 24 },
  progressLabel: { fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 },
  progressTrack: { height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', background: 'var(--green)', borderRadius: 3, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' },
  moduleList: { display: 'flex', flexDirection: 'column', gap: 12 },
  moduleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid', borderRadius: 10, cursor: 'pointer', transition: 'all 0.3s ease' },
  modTitle: { fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15 },
  modMeta: { fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)', margin: 0 },
}
