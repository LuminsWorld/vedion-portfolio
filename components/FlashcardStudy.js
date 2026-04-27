import { useState, useEffect, useCallback } from 'react'

/* ─── Topic mapping ─── */
export const QUESTION_TOPICS = {
  'e1-q1':  { module: 'module-2', label: 'Module 2 · Data Structures' },
  'e1-q2':  { module: 'module-1', label: 'Module 1 · Intro R' },
  'e1-q3':  { module: 'module-3', label: 'Module 3 · ggplot2' },
  'e1-q4':  { module: 'module-4', label: 'Module 4 · dplyr' },
  'e1-q5':  { module: 'module-3', label: 'Module 3 · ggplot2' },
  'e1-q6':  { module: 'module-4', label: 'Module 4 · dplyr' },
  'e1-q7':  { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'e1-q8':  { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'e1-q9':  { module: 'module-2', label: 'Module 2 · Data Structures' },
  'e1-q10': { module: 'module-1', label: 'Module 1 · Intro R' },
  'e1-q11': { module: 'module-4', label: 'Module 4 · dplyr' },
  'e1-q12': { module: 'module-3', label: 'Module 3 · ggplot2' },
  'e1-q13': { module: 'module-5', label: 'Module 5 · Joins & Pivots' },
  'e1-q14': { module: 'module-4', label: 'Module 4 · dplyr' },
  'e1-q15': { module: 'module-2', label: 'Module 2 · Data Structures' },
  'e2-q1':  { module: 'module-6', label: 'Module 6 · Probability' },
  'e2-q2':  { module: 'module-7', label: 'Module 7 · Binomial' },
  'e2-q3':  { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'e2-q4':  { module: 'module-6', label: 'Module 6 · Probability' },
  'e2-q5':  { module: 'module-7', label: 'Module 7 · Binomial' },
  'e2-q6':  { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'e2-q7':  { module: 'module-6', label: 'Module 6 · Probability' },
  'e2-q8':  { module: 'module-7', label: 'Module 7 · Binomial' },
  'e2-q9':  { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'e2-q10': { module: 'module-6', label: 'Module 6 · Probability' },
  'e2-q11': { module: 'module-7', label: 'Module 7 · Binomial' },
  'e2-q12': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  'e2-q13': { module: 'module-6', label: 'Module 6 · Probability' },
  'e2-q14': { module: 'module-7', label: 'Module 7 · Binomial' },
  'e2-q15': { module: 'module-8', label: 'Module 8 · Normal Dist.' },
  // exam-final-new: Inference Review (modules 9-13)
  'ef-new-q1':  { module: 'module-9',  label: 'Module 9 · CI & Hypothesis Testing' },
  'ef-new-q2':  { module: 'module-9',  label: 'Module 9 · CI & Hypothesis Testing' },
  'ef-new-q3':  { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'ef-new-q4':  { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'ef-new-q5':  { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'ef-new-q6':  { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'ef-new-q7':  { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'ef-new-q8':  { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'ef-new-q9':  { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'ef-new-q10': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'ef-new-q11': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'ef-new-q12': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'ef-new-q13': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'ef-new-q14': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'ef-new-q15': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  // exam-final: Cumulative all modules 1-13
  'ef-q1':  { module: 'module-4',  label: 'Module 4 · dplyr' },
  'ef-q2':  { module: 'module-3',  label: 'Module 3 · ggplot2' },
  'ef-q3':  { module: 'module-4',  label: 'Module 4 · dplyr' },
  'ef-q4':  { module: 'module-5',  label: 'Module 5 · Joins & Pivots' },
  'ef-q5':  { module: 'module-7',  label: 'Module 7 · Binomial' },
  'ef-q6':  { module: 'module-8',  label: 'Module 8 · Normal Dist.' },
  'ef-q7':  { module: 'module-8',  label: 'Module 8 · Normal Dist.' },
  'ef-q8':  { module: 'module-9',  label: 'Module 9 · CI & Hypothesis Testing' },
  'ef-q9':  { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'ef-q10': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'ef-q11': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'ef-q12': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'ef-q13': { module: 'module-13', label: 'Module 13 · Linear Regression' },
  'ef-q14': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'ef-q15': { module: 'module-5',  label: 'Module 5 · Joins & Pivots' },
  'ef-q16': { module: 'module-11', label: 'Module 11 · Single Mean Inference' },
  'ef-q17': { module: 'module-12', label: 'Module 12 · Two-Sample & Paired' },
  'ef-q18': { module: 'module-9',  label: 'Module 9 · CI & Hypothesis Testing' },
  'ef-q19': { module: 'module-10', label: 'Module 10 · Proportion Inference' },
  'ef-q20': { module: 'module-13', label: 'Module 13 · Linear Regression' },
}

/* ─── SM-2 algorithm ─── */
function updateCard(card, rating) {
  const newCard = { ...card, attempts: card.attempts + 1, lastSeen: Date.now() }
  if (rating === 2) {
    newCard.score = Math.min(10, card.score + 2)
    newCard.interval = Math.max(1, card.interval * 2)
    newCard.correct = card.correct + 1
  } else if (rating === 1) {
    newCard.score = Math.min(10, card.score + 1)
    newCard.interval = card.interval
  } else {
    newCard.score = Math.max(0, card.score - 3)
    newCard.interval = 1
  }
  return newCard
}

/* ─── Session card ordering ─── */
function buildSession(questions, progress) {
  return [...questions].sort((a, b) => {
    const pa = progress.cards[a.id] ?? { score: 0, lastSeen: null }
    const pb = progress.cards[b.id] ?? { score: 0, lastSeen: null }
    if (!pa.lastSeen && pb.lastSeen) return -1
    if (pa.lastSeen && !pb.lastSeen) return 1
    if (pa.score !== pb.score) return pa.score - pb.score
    return (pa.lastSeen ?? 0) - (pb.lastSeen ?? 0)
  })
}

/* ─── Init progress ─── */
function initProgress(questions, existing) {
  if (existing && existing.cards) return existing
  const cards = {}
  questions.forEach(q => {
    cards[q.id] = { score: 0, interval: 1, lastSeen: null, attempts: 0, correct: 0 }
  })
  return { cards, sessionCount: 0, lastSession: null }
}

/* ─── R syntax highlighter (minimal, for code in questions) ─── */
function highlightR(code) {
  let out = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  out = out.replace(/(#[^\n]*)/g, '<span style="color:#5a6a5a;font-style:italic">$1</span>')
  out = out.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span style="color:#ce9178">$1</span>')
  out = out.replace(/\b(function|if|else|for|while|return|library|TRUE|FALSE|NA|NULL|NaN|Inf|in)\b/g, '<span style="color:#c586c0;font-weight:600">$1</span>')
  out = out.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#b5cea8">$1</span>')
  out = out.replace(/(<-|->|==|!=|>=|<=|%>%|\|>|%%|%in%)/g, '<span style="color:#569cd6">$1</span>')
  return out
}

/* ─── Inline text with backtick/bold/italic ─── */
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

/* ─── Topic helpers ─── */
function getTopicLabel(qId) {
  return QUESTION_TOPICS[qId]?.label ?? 'Unknown Topic'
}

function getTopicStats(questions, progress) {
  const topics = {}
  questions.forEach(q => {
    const topic = QUESTION_TOPICS[q.id]
    if (!topic) return
    if (!topics[topic.label]) topics[topic.label] = { scores: [], module: topic.module }
    const card = progress.cards[q.id]
    topics[topic.label].scores.push(card ? card.score : 0)
  })
  return Object.entries(topics).map(([label, data]) => {
    const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length
    return { label, avg, module: data.module }
  }).sort((a, b) => a.avg - b.avg)
}

function getWeakCount(questions, progress) {
  const stats = getTopicStats(questions, progress)
  return stats.filter(t => t.avg < 4).length
}

/* ─── Main component ─── */
export default function FlashcardStudy({ questions, progress: initialProgress, onSaveProgress, onClose }) {
  const [progress, setProgress] = useState(() => initProgress(questions, initialProgress))
  const [phase, setPhase] = useState('start') // start | study | complete
  const [sessionCards, setSessionCards] = useState([])
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionResults, setSessionResults] = useState({ gotIt: 0, kinda: 0, missed: 0 })

  // Sync progress from prop
  useEffect(() => {
    if (initialProgress && initialProgress.cards) {
      setProgress(initialProgress)
    }
  }, [initialProgress])

  const startSession = useCallback(() => {
    const ordered = buildSession(questions, progress)
    setSessionCards(ordered)
    setCardIndex(0)
    setFlipped(false)
    setSessionResults({ gotIt: 0, kinda: 0, missed: 0 })
    setPhase('study')
  }, [questions, progress])

  const handleRating = useCallback(async (rating) => {
    const q = sessionCards[cardIndex]
    const oldCard = progress.cards[q.id] ?? { score: 0, interval: 1, lastSeen: null, attempts: 0, correct: 0 }
    const newCard = updateCard(oldCard, rating)

    const newProgress = {
      ...progress,
      cards: { ...progress.cards, [q.id]: newCard },
    }

    // Update results
    const newResults = { ...sessionResults }
    if (rating === 2) newResults.gotIt++
    else if (rating === 1) newResults.kinda++
    else newResults.missed++
    setSessionResults(newResults)

    // Check if last card
    if (cardIndex >= sessionCards.length - 1) {
      const finalProgress = {
        ...newProgress,
        sessionCount: (newProgress.sessionCount ?? 0) + 1,
        lastSession: Date.now(),
      }
      setProgress(finalProgress)
      setPhase('complete')
      if (onSaveProgress) await onSaveProgress(finalProgress)
    } else {
      setProgress(newProgress)
      setCardIndex(cardIndex + 1)
      setFlipped(false)
      if (onSaveProgress) await onSaveProgress(newProgress)
    }
  }, [sessionCards, cardIndex, progress, sessionResults, onSaveProgress])

  const currentCard = sessionCards[cardIndex]

  /* ═══════════════════════════════════════════
     STATE 1 — SESSION START
     ═══════════════════════════════════════════ */
  if (phase === 'start') {
    const topicStats = getTopicStats(questions, progress)
    const weakCount = getWeakCount(questions, progress)
    const isFirst = !progress.sessionCount || progress.sessionCount === 0
    const newCardCount = questions.filter(q => !progress.cards[q.id]?.lastSeen).length

    return (
      <div style={{ padding: '32px 0' }}>
        {/* Close button */}
        <button onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 14px', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', letterSpacing: '0.1em', marginBottom: 24 }}>
          ← BACK TO EXAM
        </button>

        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: 16 }}>
            FLASHCARD STUDY
          </div>

          <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 900, fontSize: 'clamp(1.4rem,4vw,2rem)', marginBottom: 12 }}>
            {isFirst ? 'First Session — All Cards Are New' : `${questions.length} cards · Session #${(progress.sessionCount ?? 0) + 1}${weakCount > 0 ? ` · ${weakCount} weak topic${weakCount > 1 ? 's' : ''}` : ''}`}
          </div>

          {!isFirst && (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 8 }}>
              {newCardCount > 0 ? `${newCardCount} unseen card${newCardCount > 1 ? 's' : ''} · ` : ''}Cards sorted weakest-first
            </div>
          )}

          {/* Topic preview */}
          <div style={{ maxWidth: 400, margin: '28px auto', textAlign: 'left' }}>
            {topicStats.map(t => {
              const color = t.avg > 6 ? '#00FF41' : t.avg >= 4 ? '#FFB800' : '#FF2D55'
              return (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1 }}>{t.label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color }}>{t.avg.toFixed(1)}/10</span>
                </div>
              )
            })}
          </div>

          <button onClick={startSession} style={{ background: '#00FF41', color: '#000', border: 'none', borderRadius: 6, padding: '14px 36px', fontFamily: 'JetBrains Mono,monospace', fontWeight: 900, fontSize: 14, cursor: 'pointer', letterSpacing: '0.08em', marginTop: 16 }}>
            START STUDYING
          </button>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════
     STATE 4 — SESSION COMPLETE
     ═══════════════════════════════════════════ */
  if (phase === 'complete') {
    const total = sessionResults.gotIt + sessionResults.kinda + sessionResults.missed
    const pct = (n) => total ? Math.round((n / total) * 100) : 0
    const topicStats = getTopicStats(questions, progress)

    return (
      <div style={{ padding: '32px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00FF41', letterSpacing: '0.25em', marginBottom: 12 }}>SESSION COMPLETE</div>
          <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 900, fontSize: 'clamp(1.6rem,4vw,2.2rem)', marginBottom: 20 }}>
            {total} Cards Reviewed
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 24, fontWeight: 700, color: '#00FF41' }}>{pct(sessionResults.gotIt)}%</div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>GOT IT</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 24, fontWeight: 700, color: '#FFB800' }}>{pct(sessionResults.kinda)}%</div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>KINDA</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 24, fontWeight: 700, color: '#FF2D55' }}>{pct(sessionResults.missed)}%</div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>MISSED</div>
            </div>
          </div>
        </div>

        {/* Weak areas table */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: 12 }}>WEAK AREAS BREAKDOWN</div>
          <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', padding: '10px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ flex: 1, fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>TOPIC</span>
              <span style={{ width: 70, textAlign: 'right', fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>SCORE</span>
              <span style={{ width: 120, textAlign: 'right', fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>STATUS</span>
            </div>
            {topicStats.map(t => {
              const color = t.avg > 6 ? '#00FF41' : t.avg >= 4 ? '#FFB800' : '#FF2D55'
              const statusText = t.avg > 6 ? 'GOOD' : t.avg >= 4 ? 'REVIEW' : 'NEEDS WORK'
              return (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ flex: 1, fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{t.label}</span>
                  <span style={{ width: 70, textAlign: 'right', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{t.avg.toFixed(1)}/10</span>
                  <span style={{ width: 120, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color, background: color + '15', border: `1px solid ${color}33`, padding: '2px 8px', borderRadius: 4 }}>
                      {statusText}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => { setPhase('start') }} style={{ background: '#00FF41', color: '#000', border: 'none', borderRadius: 6, padding: '12px 28px', fontFamily: 'JetBrains Mono,monospace', fontWeight: 900, fontSize: 12, cursor: 'pointer', letterSpacing: '0.08em' }}>
            STUDY AGAIN
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', borderRadius: 6, padding: '12px 24px', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, cursor: 'pointer', letterSpacing: '0.1em' }}>
            BACK TO EXAM
          </button>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════
     STATE 2 & 3 — CARD (FRONT / BACK)
     ═══════════════════════════════════════════ */
  const q = currentCard
  if (!q) return null
  const progressPct = ((cardIndex) / sessionCards.length) * 100
  const topicLabel = getTopicLabel(q.id)

  return (
    <div style={{ padding: '32px 0' }}>
      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#00FF41', width: `${progressPct}%`, transition: 'width 0.3s ease', borderRadius: 2 }} />
      </div>

      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            Card {cardIndex + 1} / {sessionCards.length}
          </span>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(0,255,65,0.6)', background: 'rgba(0,255,65,0.06)', padding: '3px 10px', borderRadius: 4, letterSpacing: '0.1em' }}>
          {topicLabel.toUpperCase()}
        </span>
      </div>

      {/* Card container with flip */}
      <div style={{ perspective: 1000, marginBottom: 24 }}>
        <div style={{
          position: 'relative',
          minHeight: 300,
          transition: 'transform 0.4s ease',
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          {/* FRONT */}
          <div style={{
            position: flipped ? 'absolute' : 'relative',
            inset: flipped ? 0 : undefined,
            width: '100%',
            backfaceVisibility: 'hidden',
            background: '#0d1117',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 'clamp(20px,4vw,32px)',
            boxSizing: 'border-box',
          }}>
            {/* Question type badge */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {q.type === 'select-all' && <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#FFB800', background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)', padding: '3px 8px', borderRadius: 4, letterSpacing: '0.1em' }}>SELECT ALL</span>}
              {q.type === 'fill-blank' && <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#00D4FF', background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', padding: '3px 8px', borderRadius: 4, letterSpacing: '0.1em' }}>FILL IN</span>}
            </div>

            <p style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 'clamp(15px,2.5vw,18px)', color: '#fff', lineHeight: 1.7, margin: '0 0 16px' }}>
              <InlineText text={q.question} />
            </p>

            {/* Code block if present */}
            {q.code && (
              <pre style={{ margin: '12px 0', padding: '12px 16px', background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontFamily: 'JetBrains Mono,monospace', fontSize: 12.5, lineHeight: 1.65, color: '#d4d4d4', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                <code dangerouslySetInnerHTML={{ __html: highlightR(q.code) }} />
              </pre>
            )}

            {/* Options preview for multiple choice / select-all */}
            {(q.type === 'multiple' || q.type === 'select-all') && q.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {q.options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', minWidth: 16 }}>{String.fromCharCode(65 + i)}</span>
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}><InlineText text={opt} /></span>
                  </div>
                ))}
              </div>
            )}

            {/* Fill-blank template */}
            {q.type === 'fill-blank' && q.template && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', borderRadius: 8, fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                {q.template}
              </div>
            )}

            {/* Flip button */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button onClick={() => setFlipped(true)} style={{ background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.25)', color: '#00FF41', borderRadius: 6, padding: '12px 32px', fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: '0.1em' }}>
                FLIP → REVEAL ANSWER
              </button>
            </div>
          </div>

          {/* BACK */}
          <div style={{
            position: flipped ? 'relative' : 'absolute',
            inset: flipped ? undefined : 0,
            width: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: '#0d1117',
            border: '1px solid rgba(0,255,65,0.3)',
            borderRadius: 12,
            padding: 'clamp(20px,4vw,32px)',
            boxShadow: '0 0 20px rgba(0,255,65,0.08)',
            boxSizing: 'border-box',
          }}>
            {/* Re-show question briefly */}
            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, margin: '0 0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
              <InlineText text={q.question} />
            </p>

            {/* Answer display */}
            {q.type === 'multiple' && q.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {q.options.map((opt, i) => {
                  const isCorrectOpt = i === q.answer
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 6,
                      background: isCorrectOpt ? 'rgba(0,255,65,0.08)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${isCorrectOpt ? 'rgba(0,255,65,0.3)' : 'rgba(255,255,255,0.04)'}`,
                    }}>
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, fontWeight: 700, color: isCorrectOpt ? '#00FF41' : 'rgba(255,255,255,0.2)', minWidth: 16 }}>
                        {isCorrectOpt ? '+' : String.fromCharCode(65 + i)}
                      </span>
                      <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: isCorrectOpt ? '#00FF41' : 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}><InlineText text={opt} /></span>
                    </div>
                  )
                })}
              </div>
            )}

            {q.type === 'select-all' && q.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {q.options.map((opt, i) => {
                  const isCorrectOpt = (q.answer ?? []).includes(i)
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 6,
                      background: isCorrectOpt ? 'rgba(0,255,65,0.08)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${isCorrectOpt ? 'rgba(0,255,65,0.3)' : 'rgba(255,255,255,0.04)'}`,
                    }}>
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, fontWeight: 700, color: isCorrectOpt ? '#00FF41' : 'rgba(255,255,255,0.2)', minWidth: 16 }}>
                        {isCorrectOpt ? '+' : ' '}
                      </span>
                      <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: isCorrectOpt ? '#00FF41' : 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}><InlineText text={opt} /></span>
                    </div>
                  )
                })}
              </div>
            )}

            {q.type === 'fill-blank' && (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(0,255,65,0.06)', border: '1px solid rgba(0,255,65,0.2)', borderRadius: 8 }}>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(0,255,65,0.6)', letterSpacing: '0.1em' }}>ANSWER: </span>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 14, color: '#00FF41' }}>{q.blanks?.[0] ?? String(q.answer)}</span>
              </div>
            )}

            {/* Explanation */}
            {q.explanation && (
              <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, borderLeft: '3px solid rgba(255,255,255,0.1)', marginBottom: 24 }}>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: 6 }}>EXPLANATION</div>
                <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.7 }}>
                  <InlineText text={q.explanation} />
                </p>
              </div>
            )}

            {/* Rating buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => handleRating(0)} style={{
                background: 'rgba(255,45,85,0.15)', border: '1px solid #FF2D55', color: '#FF2D55',
                borderRadius: 6, padding: '10px 20px', fontFamily: 'JetBrains Mono,monospace', fontSize: 13,
                cursor: 'pointer', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em',
              }}>
                MISSED
              </button>
              <button onClick={() => handleRating(1)} style={{
                background: 'rgba(255,184,0,0.15)', border: '1px solid #FFB800', color: '#FFB800',
                borderRadius: 6, padding: '10px 20px', fontFamily: 'JetBrains Mono,monospace', fontSize: 13,
                cursor: 'pointer', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em',
              }}>
                ~ KINDA
              </button>
              <button onClick={() => handleRating(2)} style={{
                background: 'rgba(0,255,65,0.15)', border: '1px solid #00FF41', color: '#00FF41',
                borderRadius: 6, padding: '10px 20px', fontFamily: 'JetBrains Mono,monospace', fontSize: 13,
                cursor: 'pointer', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em',
              }}>
                GOT IT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
