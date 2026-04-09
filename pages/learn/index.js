import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { getAllCourses } from '../../lib/courseData'
import LearnAccountButton from '../../components/LearnAccountButton'

export async function getStaticProps() {
  return { props: { courses: getAllCourses() } }
}

function ProgressRing({ progress = 0 }) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
      <circle
        cx="55"
        cy="55"
        r={radius}
        fill="none"
        stroke="var(--green)"
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text
        x="55"
        y="55"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="18"
        fontWeight="700"
        fill="var(--green)"
        fontFamily="JetBrains Mono"
      >
        {Math.round(progress)}%
      </text>
    </svg>
  )
}


const COURSE_IMAGES = {
  stat240: '/assets/gen/course_stats.png',
  example: '/assets/gen/course_datascience.png',
}

export default function LearnIndex({ courses }) {
  const [hoveredCard, setHoveredCard] = useState(null)

  return (
    <div style={s.root}>
      <Head><title>Learn — Vedion</title></Head>
      <div style={s.container}>
        {/* Top nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
          <Link href="/" style={{ ...s.back, textDecoration: 'none' }}>← BACK</Link>
          <LearnAccountButton />
        </div>

        {/* Hero */}
        <div style={s.hero}>
          <h1 style={s.heroTitle}>LEARN</h1>
          <p style={s.heroSub}>Courses built around how developers actually think.</p>
        </div>

        {/* Course grid */}
        <div style={s.grid}>
          {courses.map((c) => (
            <Link key={c.id} href={`/learn/${c.id}`} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  ...s.card,
                  border: hoveredCard === c.id ? '1px solid var(--green)' : '1px solid var(--border)',
                  boxShadow: hoveredCard === c.id ? '0 0 20px rgba(57,255,139,0.15)' : 'none',
                  transform: hoveredCard === c.id ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={() => setHoveredCard(c.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Cover image or fallback */}
                <div
                  style={{
                    width: '100%',
                    height: 160,
                    background: `linear-gradient(135deg, var(--green-dim), rgba(75,16,160,0.15))`,
                    borderRadius: '8px 8px 0 0',
                    marginBottom: 16,
                    backgroundImage: COURSE_IMAGES[c.id] ? `url(${COURSE_IMAGES[c.id]})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(4,4,10,0.3)',
                      borderRadius: '8px 8px 0 0',
                      pointerEvents: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div>
                    <h2 style={s.cardTitle}>{c.title}</h2>
                    <p style={s.cardMeta}>{c.moduleCount} modules</p>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <ProgressRing progress={0} />
                  </div>
                </div>

                <span style={s.startBtn}>START</span>
              </div>
            </Link>
          ))}
        </div>

        {courses.length === 0 && (
          <p style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 64 }}>
            No courses yet — check back soon.
          </p>
        )}
      </div>
    </div>
  )
}

const s = {
  root: { background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' },
  container: { maxWidth: 1000, margin: '0 auto', padding: '48px 24px' },
  hero: { marginBottom: 64 },
  heroTitle: { fontFamily: 'Inter, sans-serif', fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 12px', color: 'var(--text)' },
  heroSub: { fontFamily: 'Inter, sans-serif', fontSize: 16, color: 'var(--text-dim)', margin: 0 },
  back: { fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 20,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cardTitle: { fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--text)', margin: 0 },
  cardMeta: { fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)', margin: 0 },
  startBtn: { fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--green)', letterSpacing: 2, marginTop: 8 },
}
