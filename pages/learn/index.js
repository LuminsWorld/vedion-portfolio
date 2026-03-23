import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { getAllCourses } from '../../lib/courseData'
import LearnAccountButton from '../../components/LearnAccountButton'

export async function getStaticProps() {
  return { props: { courses: getAllCourses() } }
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

        <div style={s.header}>
          <h1 style={s.title}>LEARN</h1>
          <p style={s.sub}>Interactive courses with quizzes and progress tracking.</p>
        </div>

        <div style={s.grid}>
          {courses.map(c => (
            <Link key={c.id} href={`/learn/${c.id}`} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  ...s.card,
                  border: hoveredCard === c.id ? '1px solid #00FF41' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: hoveredCard === c.id ? '0 0 20px rgba(0,255,65,0.1)' : 'none',
                  transform: hoveredCard === c.id ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={() => setHoveredCard(c.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={s.cardTop}>
                  <span style={s.cardId}>{c.id.toUpperCase()}</span>
                  <span style={s.cardMods}>{c.moduleCount} modules</span>
                </div>
                <h2 style={s.cardTitle}>{c.title}</h2>
                <p style={s.cardDesc}>{c.description}</p>
                <span style={s.startBtn}>START →</span>
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
  root:      { background: '#000', minHeight: '100vh', color: '#fff' },
  container: { maxWidth: 900, margin: '0 auto', padding: '48px 24px' },
  header:    { marginBottom: 48 },
  back:      { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 2 },
  title:     { fontFamily: 'monospace', fontSize: 36, fontWeight: 900, letterSpacing: 6, color: '#00FF41', margin: '16px 0 8px' },
  sub:       { fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card:      { background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'border-color 0.2s', display: 'flex', flexDirection: 'column', gap: 8 },
  cardTop:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardId:    { fontFamily: 'monospace', fontSize: 10, color: '#00FF41', letterSpacing: 2 },
  cardMods:  { fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)' },
  cardTitle: { fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', margin: 0 },
  cardDesc:  { fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, flex: 1 },
  startBtn:  { fontFamily: 'monospace', fontSize: 11, color: '#00FF41', letterSpacing: 2, marginTop: 4 },
}
