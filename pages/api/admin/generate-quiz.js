import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

const anthropic    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const ADMIN_SECRET = process.env.ADMIN_SECRET
const COURSES_DIR  = path.join(process.cwd(), 'content', 'courses')

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  res.setHeader('Content-Type', 'application/json')

  if (!ADMIN_SECRET) return res.status(503).json({ error: 'ADMIN_SECRET not set.' })
  if (req.headers['authorization'] !== `Bearer ${ADMIN_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized.' })
  }

  const { courseId, moduleId, examExamples, questionsPerModule = 20 } = req.body ?? {}
  if (!courseId) return res.status(400).json({ error: 'courseId required' })

  const courseFile = path.join(COURSES_DIR, `${courseId}.json`)
  if (!fs.existsSync(courseFile)) return res.status(404).json({ error: 'Course not found' })

  const course = JSON.parse(fs.readFileSync(courseFile, 'utf8'))
  const modulesToProcess = moduleId
    ? course.modules.filter(m => m.id === moduleId)
    : course.modules

  const results = []

  for (const mod of modulesToProcess) {
    const prompt = buildPrompt(mod, examExamples, questionsPerModule)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    let quiz
    try {
      const text = response.content[0].text
      // Extract JSON array from response
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('No JSON array found in response')
      quiz = JSON.parse(match[0])
    } catch (e) {
      results.push({ moduleId: mod.id, error: `Parse error: ${e.message}` })
      continue
    }

    // Assign stable IDs and merge into module
    quiz = quiz.map((q, i) => ({ id: `${mod.id}-q${i + 1}`, ...q }))
    mod.quiz = quiz
    results.push({ moduleId: mod.id, generated: quiz.length })
  }

  // Write updated course back to disk
  fs.writeFileSync(courseFile, JSON.stringify(course, null, 2))

  res.json({ ok: true, results })
}

function buildPrompt(mod, examExamples, count) {
  const formatSection = examExamples ? `
## EXAM FORMAT REFERENCE
Study these exam questions carefully. Your questions must MATCH this format, style, difficulty, and wording conventions EXACTLY:

${examExamples}

Important: use the FORMAT from these examples, but generate entirely NEW questions covering different aspects of the module content below. Do not repeat or rephrase exam questions.
` : `
## FORMAT
Use clear, direct multiple-choice questions. 4 options each. One correct answer. Mix conceptual understanding, application, and recall questions.
`

  return `You are generating quiz questions for a course module.

${formatSection}

## MODULE CONTENT
Title: ${mod.title}

${mod.content}

## TASK
Generate exactly ${count} quiz questions that:
1. MATCH the format/style/difficulty from the exam examples above
2. Cover a WIDE VARIETY of content from this module — not just the obvious concepts
3. Include a mix of: core definitions, edge cases, application scenarios, common misconceptions, and "why/how" reasoning questions
4. Are at a level that genuinely tests understanding, not just memorization

Return ONLY a valid JSON array with this exact schema (no markdown, no explanation, just the array):
[
  {
    "question": "...",
    "type": "multiple",
    "options": ["A text", "B text", "C text", "D text"],
    "answer": 0,
    "explanation": "Brief explanation of why the correct answer is right (1-2 sentences)."
  }
]

The "answer" field is the 0-based index of the correct option.`
}
