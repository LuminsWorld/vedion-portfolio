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
  let mod = course.modules.find(m => m.id === params.moduleId)
  if (!mod) return { notFound: true }

  // Build pooled quiz for exam modules that declare poolFrom
  if (mod.poolFrom && course.modules) {
    const quizPool = [...(mod.quiz ?? [])]   // own questions first
    const flashPool = [...(mod.quiz ?? [])]  // own questions first

    mod.poolFrom.forEach(({ moduleId, count }) => {
      const src = course.modules.find(m => m.id === moduleId)
      if (!src?.quiz) return
      // Flash pool gets all questions from this source module
      flashPool.push(...src.quiz)
      // Quiz pool gets the first `count` questions (deterministic)
      quizPool.push(...src.quiz.slice(0, count))
    })

    mod = { ...mod, quiz: quizPool, flashQuiz: flashPool }
  }

  const modIndex = course.modules.findIndex(m => m.id === params.moduleId)
  const prevMod  = course.modules[modIndex - 1] ?? null
  const nextMod  = course.modules[modIndex + 1] ?? null
  return { props: { course, mod, modIndex, prevMod, nextMod } }
}

/* ─── Progress helpers ─── */
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

/* ─── Quiz answer helpers ─── */
function isAnswered(q, answers) {
  if (q.type === 'select-all') return answers[q.id] !== undefined
  if (q.type === 'fill-blank') return (answers[q.id] ?? '').trim().length > 0
  return answers[q.id] !== undefined
}

function isCorrect(q, answers) {
  if (q.type === 'select-all') {
    const selected = [...(answers[q.id] ?? [])].sort((a, b) => a - b)
    const correct  = [...(q.answer ?? [])].sort((a, b) => a - b)
    return JSON.stringify(selected) === JSON.stringify(correct)
  }
  if (q.type === 'fill-blank') {
    const userAns = (answers[q.id] ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
    return (q.blanks ?? []).some(b => b.trim().toLowerCase().replace(/\s+/g, ' ') === userAns)
  }
  return answers[q.id] === q.answer
}

/* ─── R syntax highlighter ─── */
function highlightR(code) {
  const KEYWORDS = /\b(function|if|else|for|while|repeat|break|next|return|library|require|source|TRUE|FALSE|NA|NULL|NaN|Inf|in|class|typeof)\b/g
  const BUILTIN  = /\b(c|seq|rep|sum|mean|min|max|length|nrow|ncol|dim|head|tail|print|cat|paste|paste0|sprintf|substr|nchar|toupper|tolower|sqrt|abs|log|exp|round|floor|ceiling|is\.na|is\.numeric|is\.character|which|any|all|str|glimpse|read_csv|write_csv|ggplot|aes|geom_point|geom_bar|geom_col|geom_histogram|geom_line|geom_smooth|geom_boxplot|geom_density|geom_hline|geom_vline|geom_text|facet_wrap|facet_grid|labs|theme|theme_minimal|theme_classic|select|filter|mutate|arrange|summarize|summarise|group_by|ungroup|rename|relocate|count|distinct|drop_na|slice_min|slice_max|inner_join|left_join|right_join|full_join|anti_join|pivot_longer|pivot_wider|case_when|t\.test|prop\.test|pnorm|qnorm|dnorm|dbinom|pbinom|qbinom|var|sd|median|cor|lm|tibble|as\.factor|as\.numeric|as\.character|n|join_by)\b/g
  const OPERATOR = /(<-|->|==|!=|>=|<=|&&|\|\||%in%|%>%|\|>|~|:)/g
  const STRING   = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g
  const NUMBER   = /\b(\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g
  const COMMENT  = /(#[^\n]*)/g
  const FUNCALL  = /\b([a-zA-Z_.][a-zA-Z0-9._]*)\s*(?=\()/g

  let out = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const phs = []
  const ph = t => { const id = `\x00p${phs.length}\x00`; phs.push(t); return id }

  out = out.replace(COMMENT,  m => ph(`<span style="color:#5a6a5a;font-style:italic">${m}</span>`))
  out = out.replace(STRING,   m => ph(`<span style="color:#ce9178">${m}</span>`))
  out = out.replace(KEYWORDS, m => ph(`<span style="color:#c586c0;font-weight:600">${m}</span>`))
  out = out.replace(BUILTIN,  m => ph(`<span style="color:#dcdcaa">${m}</span>`))
  out = out.replace(NUMBER,   m => ph(`<span style="color:#b5cea8">${m}</span>`))
  out = out.replace(OPERATOR, m => ph(`<span style="color:#569cd6">${m}</span>`))
  out = out.replace(FUNCALL,  (_, fn) => ph(`<span style="color:#dcdcaa">${fn}</span>`))
  phs.forEach((t, i) => { out = out.replaceAll(`\x00p${i}\x00`, t) })
  return out
}

/* ─── Content parser ─── */
function parseContent(text) {
  const lines = text.split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim().toLowerCase() || 'r'
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      i++
      let output = null
      if (i < lines.length && (lines[i].startsWith('```output') || lines[i].startsWith('```r-out'))) {
        const outLines = []; i++
        while (i < lines.length && !lines[i].startsWith('```')) { outLines.push(lines[i]); i++ }
        i++; output = outLines.join('\n')
      }
      blocks.push({ type: 'code', lang, code: codeLines.join('\n'), output }); continue
    }
    if (line.startsWith('| ')) {
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i++ }
      blocks.push({ type: 'table', rows }); continue
    }
    if (line.startsWith('> ')) {
      const calloutLines = []
      while (i < lines.length && lines[i].startsWith('> ')) { calloutLines.push(lines[i].slice(2)); i++ }
      blocks.push({ type: 'callout', lines: calloutLines }); continue
    }
    if (line.startsWith('$$')) {
      const formulaLines = []
      while (i < lines.length && lines[i].startsWith('$$')) { formulaLines.push(lines[i].slice(2).trim()); i++ }
      blocks.push({ type: 'formula', lines: formulaLines }); continue
    }
    if (line.startsWith('# '))   { blocks.push({ type: 'h1', text: line.slice(2) });  i++; continue }
    if (line.startsWith('## '))  { blocks.push({ type: 'h2', text: line.slice(3) });  i++; continue }
    if (line.startsWith('### ')) { blocks.push({ type: 'h3', text: line.slice(4) });  i++; continue }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) { items.push(lines[i].slice(2)); i++ }
      blocks.push({ type: 'list', items }); continue
    }
    if (line.trim() === '') { blocks.push({ type: 'br' }); i++; continue }
    blocks.push({ type: 'para', text: line }); i++
  }
  return blocks
}

/* ─── Inline text renderer ─── */
/* Render overline letters (x̄ ȳ d̄) with CSS overline to avoid font offset issues */
function renderOverline(str) {
  const MAP = { 'x̄': 'x', 'ȳ': 'y', 'd̄': 'd' }
  const tokens = str.split(/(x̄|ȳ|d̄)/g)
  return tokens.map((tok, i) =>
    MAP[tok]
      ? <span key={i} style={{ textDecoration: 'overline', textDecorationColor: 'currentcolor' }}>{MAP[tok]}</span>
      : tok
  )
}

function InlineText({ text }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`'))
          return <code key={i} style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.88em', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, color: '#ce9178' }}>{part.slice(1, -1)}</code>
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} style={{ color: '#fff', fontWeight: 700 }}>{renderOverline(part.slice(2, -2))}</strong>
        if (part.startsWith('*') && part.endsWith('*'))
          return <em key={i} style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.85)' }}>{renderOverline(part.slice(1, -1))}</em>
        return <span key={i}>{renderOverline(part)}</span>
      })}
    </>
  )
}

/* ─── Line-numbered code renderer ─── */
function CodeLines({ code, lang, highlighted }) {
  const raw = (highlighted ? code : code).split('\n')
  const displayLines = raw[raw.length - 1] === '' ? raw.slice(0, -1) : raw
  const isOutput = lang === 'output' || lang === 'r-out'
  const lineNumColor = isOutput ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)'
  const textColor = isOutput ? '#00FF41' : '#d4d4d4'

  if (highlighted) {
    // Split highlighted HTML by newlines — each line is rendered with dangerouslySetInnerHTML
    const htmlLines = highlightR(code).split('\n')
    const dispHtml = htmlLines[htmlLines.length - 1] === '' ? htmlLines.slice(0, -1) : htmlLines
    return (
      <div style={{ padding: '12px 0', overflowX: 'auto' }}>
        {dispHtml.map((html, i) => (
          <div key={i} style={{ display: 'flex', minHeight: 20 }}>
            <span style={{ width: 40, minWidth: 40, textAlign: 'right', paddingRight: 12, color: lineNumColor, fontSize: 12, fontFamily: 'JetBrains Mono,monospace', userSelect: 'none', lineHeight: '20px', flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: textColor, lineHeight: '20px', whiteSpace: 'pre' }} dangerouslySetInnerHTML={{ __html: html || ' ' }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 0', overflowX: 'auto' }}>
      {displayLines.map((line, i) => (
        <div key={i} style={{ display: 'flex', minHeight: 20 }}>
          <span style={{ width: 40, minWidth: 40, textAlign: 'right', paddingRight: 12, color: lineNumColor, fontSize: 12, fontFamily: 'JetBrains Mono,monospace', userSelect: 'none', lineHeight: '20px', flexShrink: 0 }}>{i + 1}</span>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: isOutput ? 12 : 13, color: textColor, lineHeight: '20px', whiteSpace: 'pre' }}>{line || ' '}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Code window ─── */
function CodeWindow({ code, lang, output }) {
  const [copied, setCopied] = useState(false)
  const [showOut, setShowOut] = useState(false)
  const copy = () => { navigator.clipboard?.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  return (
    <div style={{ margin: '20px 0', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#0d1117' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: '#161b22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          </div>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginLeft: 6 }}>{lang === 'r' || lang === '' ? 'R' : lang.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {output && <button onClick={() => setShowOut(o => !o)} style={{ background: showOut ? 'rgba(0,255,65,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showOut ? 'rgba(0,255,65,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 4, padding: '3px 10px', fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: showOut ? '#00FF41' : 'rgba(255,255,255,0.4)', cursor: 'pointer', letterSpacing: '0.1em' }}>{showOut ? '▶ OUTPUT' : '▷ OUTPUT'}</button>}
          <button onClick={copy} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '3px 10px', fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', letterSpacing: '0.1em' }}>{copied ? 'COPIED' : 'COPY'}</button>
        </div>
      </div>
      <CodeLines code={code} lang={lang} highlighted={true} />
      {output && showOut && (
        <div style={{ borderTop: '1px solid rgba(0,255,65,0.15)', background: '#0a0f0a' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(0,255,65,0.5)', letterSpacing: '0.15em', padding: '8px 12px 0 52px' }}>OUTPUT</div>
          <CodeLines code={output} lang="output" highlighted={false} />
        </div>
      )}
    </div>
  )
}

/* ─── Inline code snippet for quiz questions ─── */
function QuizCode({ code }) {
  return (
    <pre style={{ margin: '10px 0', padding: '12px 16px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontFamily: 'JetBrains Mono,monospace', fontSize: 12.5, lineHeight: 1.65, color: '#d4d4d4', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
      <code dangerouslySetInnerHTML={{ __html: highlightR(code) }} />
    </pre>
  )
}

/* ─── Table renderer ─── */
function TableBlock({ rows }) {
  const parsed = rows.map(r => r.split('|').map(c => c.trim()).filter(Boolean))
  if (!parsed.length) return null
  const headers = parsed[0]
  const body = parsed.slice(1).filter(r => !r.every(c => /^[-:]+$/.test(c)))
  return (
    <div style={{ overflowX: 'auto', margin: '16px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>{headers.map((h, i) => <th key={i} style={{ padding: '8px 14px', textAlign: 'left', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: '0.1em', color: '#00FF41', borderBottom: '1px solid rgba(0,255,65,0.2)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
              {row.map((cell, j) => <td key={j} style={{ padding: '8px 14px', color: 'rgba(255,255,255,0.65)', fontSize: 13 }}><InlineText text={cell} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Content block renderer ─── */
function ContentBlock({ block }) {
  switch (block.type) {
    case 'h1': return <h1 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 900, fontSize: 'clamp(1.4rem,3vw,1.9rem)', color: '#fff', margin: '32px 0 12px', letterSpacing: '-0.02em' }}><InlineText text={block.text} /></h1>
    case 'h2': return <h2 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 'clamp(1.1rem,2.5vw,1.35rem)', color: '#fff', margin: '28px 0 10px', letterSpacing: '-0.01em', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}><InlineText text={block.text} /></h2>
    case 'h3': return <h3 style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: 12, color: '#00FF41', margin: '20px 0 8px', letterSpacing: '0.15em', textTransform: 'uppercase' }}><InlineText text={block.text} /></h3>
    case 'para': return <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, margin: '6px 0' }}><InlineText text={block.text} /></p>
    case 'br': return <div style={{ height: 6 }} />
    case 'callout': return (
      <div style={{ margin: '16px 0', padding: '14px 18px', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', borderLeft: '3px solid #00D4FF', borderRadius: '0 8px 8px 0' }}>
        {block.lines.map((line, i) => <p key={i} style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: i > 0 ? '6px 0 0' : 0, lineHeight: 1.7 }}><InlineText text={line} /></p>)}
      </div>
    )
    case 'list': return (
      <ul style={{ margin: '8px 0 12px', paddingLeft: 0, listStyle: 'none' }}>
        {block.items.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '4px 0', fontFamily: 'Inter,sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
            <span style={{ color: '#00FF41', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, flexShrink: 0 }}>›</span>
            <span><InlineText text={item} /></span>
          </li>
        ))}
      </ul>
    )
    case 'formula': return (
      <div style={{ margin: '20px 0', padding: '18px 28px', background: 'rgba(0,255,65,0.04)', border: '1px solid rgba(0,255,65,0.18)', borderRadius: 8, textAlign: 'center' }}>
        {block.lines.map((line, i) => (
          <div key={i} style={{ marginTop: i > 0 ? 10 : 0, fontFamily: 'JetBrains Mono,monospace', fontSize: 16, color: '#7fff9a', letterSpacing: '0.04em', lineHeight: 1.6 }}>{renderOverline(line)}</div>
        ))}
      </div>
    )
    case 'code': return <CodeWindow code={block.code} lang={block.lang} output={block.output} />
    case 'table': return <TableBlock rows={block.rows} />
    default: return null
  }
}

/* ─── Quiz option (select-one) ─── */
function QuizOption({ label, text, state, onClick, disabled }) {
  const colors = {
    correct: { border: '#00FF41', bg: 'rgba(0,255,65,0.08)', text: '#00FF41' },
    wrong:   { border: '#FF2D55', bg: 'rgba(255,45,85,0.08)', text: '#FF2D55' },
    chosen:  { border: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.04)', text: '#fff' },
    default: { border: 'rgba(255,255,255,0.08)', bg: 'transparent', text: 'rgba(255,255,255,0.75)' },
  }
  const c = colors[state] ?? colors.default
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.bg, color: c.text, cursor: disabled ? 'default' : 'pointer', textAlign: 'left', width: '100%', fontFamily: 'Inter,sans-serif', fontSize: 14, lineHeight: 1.55, transition: 'all 0.15s' }}>
      <span style={{ width: 22, height: 22, borderRadius: 5, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, fontWeight: 700, flexShrink: 0, color: c.border, marginTop: 1 }}>{label}</span>
      <span><InlineText text={text} /></span>
    </button>
  )
}

/* ─── Checkbox option (select-all) ─── */
function CheckboxOption({ label, text, checked, state, onChange, disabled }) {
  const colors = {
    correct:       { border: '#00FF41', bg: 'rgba(0,255,65,0.08)' },
    wrong:         { border: '#FF2D55', bg: 'rgba(255,45,85,0.08)' },
    missed:        { border: 'rgba(0,255,65,0.5)', bg: 'rgba(0,255,65,0.03)' },
    checked:       { border: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.04)' },
    default:       { border: 'rgba(255,255,255,0.08)', bg: 'transparent' },
  }
  const c = colors[state] ?? colors.default
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.bg, cursor: disabled ? 'default' : 'pointer', transition: 'all 0.15s' }}>
      <div style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${c.border}`, background: checked ? c.border : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s' }}>
        {checked && <span style={{ color: state === 'wrong' ? '#FF2D55' : '#000', fontSize: 11, fontWeight: 900, lineHeight: 1 }}>+</span>}
      </div>
      <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, lineHeight: 1.55, color: 'rgba(255,255,255,0.8)' }}>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, fontWeight: 700, color: c.border, marginRight: 8 }}>{label}</span>
        <InlineText text={text} />
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} style={{ display: 'none' }} />
    </label>
  )
}

/* ─── Quiz question renderer ─── */
function QuizQuestion({ q, qi, answers, submitted, onAnswer }) {
  const answered  = isAnswered(q, answers)
  const correct   = submitted ? isCorrect(q, answers) : null
  const qType     = q.type ?? 'multiple'

  const borderColor = !submitted ? (answered ? 'rgba(0,255,65,0.12)' : 'rgba(255,255,255,0.06)')
    : (correct ? 'rgba(0,255,65,0.2)' : 'rgba(255,45,85,0.2)')

  return (
    <div style={{ background: '#090909', border: `1px solid ${borderColor}`, borderRadius: 12, padding: 'clamp(14px,3vw,22px)', transition: 'border-color 0.2s' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#00FF41', letterSpacing: '0.2em', background: 'rgba(0,255,65,0.06)', padding: '3px 8px', borderRadius: 4 }}>Q{qi + 1}</span>
          {qType === 'select-all' && <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,184,0,0.8)', letterSpacing: '0.1em', background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)', padding: '3px 8px', borderRadius: 4 }}>SELECT ALL</span>}
          {qType === 'fill-blank' && <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(0,212,255,0.8)', letterSpacing: '0.1em', background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', padding: '3px 8px', borderRadius: 4 }}>FILL IN</span>}
          {submitted && <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: correct ? '#00FF41' : '#FF2D55', letterSpacing: '0.1em', background: correct ? 'rgba(0,255,65,0.08)' : 'rgba(255,45,85,0.08)', padding: '3px 8px', borderRadius: 4 }}>{correct ? 'CORRECT' : 'WRONG'}</span>}
        </div>
      </div>

      {/* Question text */}
      <p style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 'clamp(13px,2vw,15px)', color: '#fff', margin: '0 0 12px', lineHeight: 1.6 }}>
        <InlineText text={q.question} />
      </p>

      {/* Optional code block */}
      {q.code && <QuizCode code={q.code} />}

      {/* Inputs by type */}
      {qType === 'multiple' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: q.code ? 12 : 0 }}>
          {q.options.map((opt, oi) => {
            let state = 'default'
            if (!submitted) { if (answers[q.id] === oi) state = 'chosen' }
            else {
              if (oi === q.answer) state = 'correct'
              else if (answers[q.id] === oi) state = 'wrong'
            }
            return <QuizOption key={oi} label={String.fromCharCode(65 + oi)} text={opt} state={state} onClick={() => onAnswer(q.id, oi)} disabled={submitted} />
          })}
        </div>
      )}

      {qType === 'select-all' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: q.code ? 12 : 0 }}>
          <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: '0 0 8px', letterSpacing: '0.1em' }}>Select all that apply — click all correct answers</p>
          {q.options.map((opt, oi) => {
            const selected   = (answers[q.id] ?? []).includes(oi)
            const isCorrectOpt = (q.answer ?? []).includes(oi)
            let state = 'default'
            if (!submitted) { if (selected) state = 'checked' }
            else {
              if (isCorrectOpt && selected) state = 'correct'
              else if (!isCorrectOpt && selected) state = 'wrong'
              else if (isCorrectOpt && !selected) state = 'missed'
            }
            const currentSel = answers[q.id] ?? []
            return <CheckboxOption key={oi} label={String.fromCharCode(65 + oi)} text={opt} checked={selected} state={state} disabled={submitted}
              onChange={() => {
                if (submitted) return
                const next = selected ? currentSel.filter(x => x !== oi) : [...currentSel, oi]
                onAnswer(q.id, next)
              }} />
          })}
          {submitted && !correct && (
            <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(0,255,65,0.6)', margin: '6px 0 0', letterSpacing: '0.1em' }}>
              Correct: {q.answer.map(i => String.fromCharCode(65 + i)).join(', ')}
              {q.options.filter((_, i) => !(q.answer ?? []).includes(i)).length === q.options.length - q.answer.length ? '' : ''}
            </p>
          )}
        </div>
      )}

      {qType === 'fill-blank' && (
        <div style={{ marginTop: q.code ? 12 : 6 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={answers[q.id] ?? ''}
              onChange={e => { if (!submitted) onAnswer(q.id, e.target.value) }}
              placeholder="Type your answer here..."
              disabled={submitted}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: submitted ? (correct ? '1px solid rgba(0,255,65,0.4)' : '1px solid rgba(255,45,85,0.4)') : '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '12px 16px', fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              onFocus={e => { if (!submitted) e.target.style.borderColor = 'rgba(255,255,255,0.3)' }}
              onBlur={e => { if (!submitted) e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
            />
          </div>
          {submitted && !correct && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(0,255,65,0.04)', border: '1px solid rgba(0,255,65,0.15)', borderRadius: 6 }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(0,255,65,0.6)', letterSpacing: '0.1em' }}>ACCEPTED: </span>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#00FF41' }}>{q.blanks?.[0]}</span>
              {q.blanks?.length > 1 && <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}> (or similar)</span>}
            </div>
          )}
        </div>
      )}

      {/* Explanation */}
      {submitted && q.explanation && (
        <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, borderLeft: '3px solid rgba(255,255,255,0.12)' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: 6 }}>EXPLANATION</div>
          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}><InlineText text={q.explanation} /></p>
        </div>
      )}
    </div>
  )
}

/* ─── Main page ─── */
export default function ModulePage({ course, mod, modIndex, prevMod, nextMod }) {
  const [phase, setPhase]       = useState(mod.isExam ? 'quiz' : 'lesson')
  const [answers, setAnswers]   = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [explanations, setExplanations] = useState({})
  const [loadingExp, setLoadingExp]     = useState({})
  const [expError, setExpError]         = useState({})
  const [userPlan, setUserPlan] = useState(null)
  const [readProgress, setReadProgress] = useState(0)
  const contentRef = useRef(null)
  const [flashcardMode, setFlashcardMode] = useState(false)
  const [flashcardProgress, setFlashcardProgress] = useState(null)
  const [flashcardLoaded, setFlashcardLoaded] = useState(false)

  // Read progress
  useEffect(() => {
    const onScroll = () => {
      if (!contentRef.current) return
      const el  = contentRef.current
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
        if (res.ok) { const d = await res.json(); setUserPlan(d.plan) }
      } catch (_) {}
    }
    checkPlan()
  }, [])

  // Load flashcard progress — all modules (not just exams)
  useEffect(() => {
    async function loadFlashcards() {
      try {
        const { auth } = await import('../../../lib/firebase')
        const user = auth.currentUser
        if (!user) { setFlashcardLoaded(true); return }
        const token = await user.getIdToken()
        const res = await fetch(`/api/learn/flashcards?courseId=${course.id}&moduleId=${mod.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setFlashcardProgress(data.progress ?? null)
      } catch (_) {
        setFlashcardProgress(null)
      }
      setFlashcardLoaded(true)
    }
    loadFlashcards()
  }, [mod?.id, course?.id])

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
        body: JSON.stringify({ courseId: course.id, moduleId: mod.id, progress: updatedProgress })
      })
    } catch (_) {}
  }

  // ─── Exam colour helpers (orange = midterm, purple = final) ───
  // ─── Active quiz: random 20 from pool (re-shuffled each visit) ───
  const [activeQuiz, setActiveQuiz]   = useState([])
  const [quizReady,  setQuizReady]    = useState(false)

  useEffect(() => {
    if (!mod.isExam) { setQuizReady(true); return }
    const pool = mod.flashQuiz ?? mod.quiz ?? []
    if (pool.length === 0) { setActiveQuiz([]); setQuizReady(true); return }
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    setActiveQuiz(shuffled.slice(0, Math.min(20, shuffled.length)))
    setQuizReady(true)
  }, [mod.id])

  // ─── Exam colour helpers (orange = midterm, purple = final) ───
  const isFinalExam    = mod.isExam && mod.examKind === 'final'
  const examColorSolid = isFinalExam ? '#A855F7' : '#FFB800'
  const ec = (a) => isFinalExam ? `rgba(168,85,247,${a})` : `rgba(255,184,0,${a})`
  const examLabel      = isFinalExam ? 'FINAL' : 'EXAM CHECKPOINT'

  const quiz       = (quizReady && mod.isExam) ? activeQuiz : (mod.quiz ?? [])
  const answered   = quiz.filter(q => isAnswered(q, answers)).length
  const allAnswered = answered === quiz.length
  const score      = quiz.filter(q => isCorrect(q, answers)).length
  const isPro      = ['pro', 'ultra'].includes(userPlan)
  const blocks     = parseContent(mod.content ?? '')
  const totalMods  = course.modules.length

  function handleAnswer(qId, value) {
    setAnswers(a => ({ ...a, [qId]: value }))
  }

  async function submitQuiz() {
    setSubmitted(true)
    const s = quiz.filter(q => isCorrect(q, answers)).length
    const quizScore = { score: s, total: quiz.length }
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
      const userAnswer = q.type === 'fill-blank' ? (answers[q.id] ?? '') : (q.options?.[answers[q.id]] ?? '')
      const correctAnswer = q.type === 'fill-blank' ? (q.blanks?.[0] ?? '') : (q.options?.[q.answer] ?? String(q.answer))
      const res = await fetch('/api/learn/explain', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, moduleId: mod.id, question: q.question, wrongAnswer: userAnswer, correctAnswer }),
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

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff' }}>
      <Head><title>{mod.title} — {course.title}</title></Head>

      {/* Read progress bar */}
      {!mod.isExam && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.05)', zIndex: 200 }}>
          <div style={{ height: '100%', background: 'var(--green,#00FF41)', width: `${readProgress}%`, transition: 'width 0.1s linear' }} />
        </div>
      )}

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px clamp(1rem,4vw,2rem)', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${mod.isExam ? ec(0.15) : 'rgba(255,255,255,0.06)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href={`/learn/${course.id}`} style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
            ← {course.title.split(':')[0].trim()}
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>/</span>
          {mod.isExam
            ? <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: examColorSolid, letterSpacing: '0.1em' }}>{mod.title}</span>
            : <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em' }}>{mod.title}</span>
          }
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>{modIndex + 1} / {totalMods}</span>
          {phase === 'lesson' && quiz.length > 0 && (
            <button onClick={() => setPhase('quiz')} style={{ background: 'var(--green,#00FF41)', color: '#000', border: 'none', borderRadius: 5, padding: '6px 14px', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer' }}>
              {mod.isExam ? 'START' : 'TAKE QUIZ'}
            </button>
          )}
          <LearnAccountButton />
        </div>
      </nav>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(2rem,5vw,3rem) clamp(1rem,4vw,2rem)' }}>

        {/* Module header */}
        <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid ${mod.isExam ? ec(0.12) : 'rgba(255,255,255,0.06)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            {mod.isExam ? (
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: examColorSolid, letterSpacing: '0.2em', background: ec(0.08), border: `1px solid ${ec(0.25)}`, padding: '4px 12px', borderRadius: 4 }}>
                {examLabel}
              </span>
            ) : (
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00FF41', letterSpacing: '0.2em', background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.2)', padding: '3px 10px', borderRadius: 4 }}>
                MODULE {String(modIndex + 1).padStart(2, '0')}
              </span>
            )}
            {mod.suggestedMinutes && (
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                ~{mod.suggestedMinutes} MIN
              </span>
            )}
            {quiz.length > 0 && (
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                {quiz.length} QUESTIONS
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem,4vw,2.4rem)', margin: '0 0 14px', letterSpacing: '-0.02em' }}>{mod.title}</h1>

          {/* Module position dots */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {course.modules.map((m, i) => (
              <Link key={m.id} href={`/learn/${course.id}/${m.id}`} style={{ textDecoration: 'none' }}>
                <div title={m.title} style={{ height: m.isExam ? 5 : 3, width: i === modIndex ? 24 : 12, borderRadius: 2, background: m.isExam ? (i === modIndex ? examColorSolid : ec(0.3)) : (i < modIndex ? '#00FF41' : i === modIndex ? '#00FF41' : 'rgba(255,255,255,0.1)'), opacity: i === modIndex ? 1 : 0.5, transition: 'all 0.3s', cursor: 'pointer' }} />
              </Link>
            ))}
          </div>
        </div>

        {/* ── FLASHCARD STUDY BUTTON (all modules) ── */}
        {!flashcardMode && (
          <div style={{ marginBottom: 40, padding: 24, background: 'rgba(0,255,65,0.04)', border: '1px solid rgba(0,255,65,0.15)', borderRadius: 8 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 8 }}>
              ADAPTIVE FLASHCARDS
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Flashcard Study Mode</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 16 }}>
              {flashcardLoaded && flashcardProgress?.sessionCount > 0
                ? `Session ${(flashcardProgress.sessionCount ?? 0) + 1} · Weak cards get shown more. 3 correct in a row to master.`
                : 'Study this module with spaced repetition. Wrong answers come back weighted heavier.'}
            </div>
            <button
              onClick={() => setFlashcardMode(true)}
              style={{ background: '#00FF41', color: '#000', border: 'none', borderRadius: 4, padding: '10px 24px', fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: '0.05em' }}
            >
              {flashcardProgress?.sessionCount > 0 ? `CONTINUE (SESSION ${(flashcardProgress.sessionCount ?? 0) + 1})` : 'START FLASHCARDS'}
            </button>
          </div>
        )}

        {flashcardMode && (
          <FlashcardStudy
            questions={mod.isExam ? (mod.flashQuiz ?? quiz) : [...(mod.quiz ?? []), ...(mod.flashcards ?? [])]}
            courseId={course.id}
            moduleId={mod.id}
            progress={flashcardProgress}
            onSaveProgress={saveFlashcardProgress}
            onClose={() => setFlashcardMode(false)}
          />
        )}

        {/* ── LESSON ── */}
        {phase === 'lesson' && (
          <div ref={contentRef}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {blocks.map((block, i) => <ContentBlock key={i} block={block} />)}
            </div>
            <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                {prevMod && (
                  <Link href={`/learn/${course.id}/${prevMod.id}`} style={{ textDecoration: 'none' }}>
                    <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', borderRadius: 7, padding: '10px 18px', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, cursor: 'pointer', letterSpacing: '0.1em' }}>← PREV</button>
                  </Link>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {quiz.length > 0 ? (
                  <button onClick={() => setPhase('quiz')} style={{ background: '#00FF41', color: '#000', border: 'none', borderRadius: 7, padding: '12px 24px', fontFamily: 'JetBrains Mono,monospace', fontWeight: 900, fontSize: 12, letterSpacing: '0.1em', cursor: 'pointer' }}>
                    TAKE QUIZ ({quiz.length}q) →
                  </button>
                ) : nextMod ? (
                  <Link href={`/learn/${course.id}/${nextMod.id}`} style={{ textDecoration: 'none' }}>
                    <button style={{ background: '#00FF41', color: '#000', border: 'none', borderRadius: 7, padding: '12px 24px', fontFamily: 'JetBrains Mono,monospace', fontWeight: 900, fontSize: 12, letterSpacing: '0.1em', cursor: 'pointer' }}>NEXT MODULE →</button>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* ── EXAM INTRO (isExam, not yet submitted) ── */}
        {!flashcardMode && mod.isExam && phase === 'lesson' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: '0.2em', color: ec(0.6), marginBottom: 16 }}>{isFinalExam ? 'READY FOR YOUR FINAL REVIEW?' : 'READY TO TEST YOUR KNOWLEDGE?'}</div>
            <button onClick={() => setPhase('quiz')} style={{ background: examColorSolid, color: '#000', border: 'none', borderRadius: 8, padding: '14px 32px', fontFamily: 'JetBrains Mono,monospace', fontWeight: 900, fontSize: 13, letterSpacing: '0.1em', cursor: 'pointer' }}>
              START EXAM →
            </button>
          </div>
        )}

        {/* ── QUIZ / EXAM ── */}
        {!flashcardMode && phase === 'quiz' && !submitted && (
          <div>
            {/* Progress header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, padding: '14px 18px', background: mod.isExam ? ec(0.03) : 'rgba(255,255,255,0.02)', borderRadius: 10, border: `1px solid ${mod.isExam ? ec(0.12) : 'rgba(255,255,255,0.06)'}` }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: mod.isExam ? examColorSolid : '#00FF41', letterSpacing: '0.2em', marginBottom: 4 }}>{mod.isExam ? examLabel : 'QUIZ'}</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 16 }}>{mod.title}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 18, fontWeight: 700, color: answered === quiz.length ? '#00FF41' : '#fff' }}>
                  {answered}<span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>/{quiz.length}</span>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>ANSWERED</div>
              </div>
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap' }}>
              {quiz.map((q) => (
                <div key={q.id} style={{ width: 8, height: 8, borderRadius: '50%', background: isAnswered(q, answers) ? (q.type === 'select-all' ? '#FFB800' : q.type === 'fill-blank' ? '#00D4FF' : '#00FF41') : 'rgba(255,255,255,0.12)', transition: 'background 0.2s' }} />
              ))}
            </div>

            {/* Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {quiz.map((q, qi) => (
                <QuizQuestion key={q.id} q={q} qi={qi} answers={answers} submitted={false} onAnswer={handleAnswer} />
              ))}
            </div>

            <div style={{ marginTop: 28, display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={submitQuiz} disabled={!allAnswered} style={{ background: allAnswered ? (mod.isExam ? examColorSolid : '#00FF41') : 'rgba(255,255,255,0.05)', color: allAnswered ? '#000' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 7, padding: '12px 28px', fontFamily: 'JetBrains Mono,monospace', fontWeight: 900, fontSize: 12, letterSpacing: '0.1em', cursor: allAnswered ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                {mod.isExam ? 'SUBMIT' : 'SUBMIT → SCORE'}
              </button>
              {!mod.isExam && (
                <button onClick={() => setPhase('lesson')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', borderRadius: 7, padding: '12px 18px', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, cursor: 'pointer', letterSpacing: '0.1em' }}>
                  ← BACK TO LESSON
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {!flashcardMode && phase === 'quiz' && submitted && (
          <div>
            {/* Score card */}
            <div style={{ padding: '28px 24px', borderRadius: 14, border: `1px solid ${score === quiz.length ? 'rgba(0,255,65,0.3)' : score >= quiz.length * 0.7 ? 'rgba(255,184,0,0.3)' : 'rgba(255,45,85,0.3)'}`, background: score === quiz.length ? 'rgba(0,255,65,0.04)' : score >= quiz.length * 0.7 ? 'rgba(255,184,0,0.04)' : 'rgba(255,45,85,0.04)', marginBottom: 28, textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>{mod.isExam ? (isFinalExam ? 'FINAL COMPLETE' : 'EXAM COMPLETE') : 'QUIZ COMPLETE'}</div>
              <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 900, fontSize: 'clamp(2.5rem,8vw,4rem)', letterSpacing: '-0.04em', color: score === quiz.length ? '#00FF41' : score >= quiz.length * 0.7 ? '#FFB800' : '#FF2D55', lineHeight: 1 }}>
                {score}<span style={{ fontSize: '0.4em', opacity: 0.5, fontWeight: 400 }}>/{quiz.length}</span>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8, letterSpacing: '0.1em' }}>
                {score === quiz.length ? 'PERFECT' : score >= quiz.length * 0.7 ? 'GOOD WORK' : 'KEEP STUDYING'}
                {' · '}{Math.round((score / quiz.length) * 100)}%
              </div>
            </div>

            {/* Answer review */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
              {quiz.map((q, qi) => {
                const correct = isCorrect(q, answers)
                return (
                  <div key={q.id}>
                    <QuizQuestion q={q} qi={qi} answers={answers} submitted={true} onAnswer={() => {}} />
                    {/* Wrong answer extras */}
                    {!correct && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', paddingLeft: 4 }}>
                        {!mod.isExam && (
                          <button onClick={() => setPhase('lesson')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '7px 14px', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', letterSpacing: '0.1em' }}>
                            ↩ Review module
                          </button>
                        )}
                        {isPro ? (
                          explanations[q.id] ? (
                            <div style={{ width: '100%', marginTop: 4, padding: '12px 14px', background: 'rgba(123,47,255,0.06)', border: '1px solid rgba(123,47,255,0.2)', borderRadius: 8 }}>
                              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: '0.15em', color: '#7B2FFF', marginBottom: 6 }}>AI EXPLANATION</div>
                              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                                {explanations[q.id].split('\n').filter(Boolean).map((line, i) => (
                                  <p key={i} style={{ margin: i > 0 ? '6px 0 0' : 0 }}><InlineText text={line} /></p>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => getAIExplanation(q)} disabled={loadingExp[q.id]} style={{ background: 'rgba(123,47,255,0.08)', border: '1px solid rgba(123,47,255,0.25)', borderRadius: 6, padding: '7px 14px', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#7B2FFF', cursor: 'pointer', letterSpacing: '0.1em' }}>
                              {loadingExp[q.id] ? 'Thinking...' : 'Explain with AI'}
                            </button>
                          )
                        ) : null}
                        {expError[q.id] && <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#FF2D55', margin: 0 }}>{expError[q.id]}</p>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {nextMod && (
                <Link href={`/learn/${course.id}/${nextMod.id}`} style={{ textDecoration: 'none' }}>
                  <button style={{ background: '#00FF41', color: '#000', border: 'none', borderRadius: 7, padding: '12px 24px', fontFamily: 'JetBrains Mono,monospace', fontWeight: 900, fontSize: 12, letterSpacing: '0.1em', cursor: 'pointer' }}>
                    NEXT: {nextMod.title} →
                  </button>
                </Link>
              )}
              <button onClick={() => { setPhase('quiz'); setSubmitted(false); setAnswers({}); setExplanations({}) }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', borderRadius: 7, padding: '12px 18px', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, cursor: 'pointer', letterSpacing: '0.1em' }}>
                ↺ RETRY
              </button>
              <Link href={`/learn/${course.id}`} style={{ textDecoration: 'none' }}>
                <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', borderRadius: 7, padding: '12px 18px', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, cursor: 'pointer', letterSpacing: '0.1em' }}>
                  ← COURSE
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
