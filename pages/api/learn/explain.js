import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '../../../lib/authMiddleware'
import { getDoc, setDoc, updateDoc } from '../../../lib/firestore'
import { getModule } from '../../../lib/courseData'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { user, error, status } = await requireAuth(req, { requireAccess: true })
  if (error) return res.status(status).json({ error })

  // Pro/Ultra only
  if (!['pro', 'ultra'].includes(user.plan)) {
    return res.status(403).json({ error: 'AI explanations are a Pro/Ultra feature.', upgradeRequired: true })
  }

  const { courseId, moduleId, cardId, question, wrongAnswer, correctAnswer, bypassCache } = req.body ?? {}
  if (!courseId || !moduleId || !question) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  // ── Cache check (skipped when bypassCache=true) ──
  const cacheKey = cardId ? `aiExplanations/${courseId}_${cardId}` : null
  if (cacheKey && !bypassCache) {
    const cached = await getDoc(cacheKey)
    if (cached?.explanation) {
      return res.json({ explanation: cached.explanation, cached: true })
    }
  }

  // ── Not cached (or bypassed) — check credits and generate ──
  const COST = 1
  if (user.credits < COST) {
    return res.status(402).json({ error: 'Not enough credits.' })
  }

  const mod = getModule(courseId, moduleId)
  const context = mod ? `Module: "${mod.title}"\n\nContent:\n${mod.content}` : ''

  const prompt = `A student is studying this flashcard question. Explain it clearly and concisely.

${context}

Question: ${question}
Their answer: ${wrongAnswer && wrongAnswer !== '(self-assessed)' ? wrongAnswer : '(none)'}
Correct answer: ${correctAnswer}

Give a short, clear explanation (2-4 sentences) of why the correct answer is right and what concept to understand. Use plain text only, no markdown headers.`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const explanation = response.content[0].text

  // ── Save to cache so future users get it free ──
  if (cacheKey) {
    await setDoc(cacheKey, {
      explanation,
      courseId,
      moduleId,
      cardId,
      question,
      generatedAt: Date.now(),
    })
  }

  // ── Deduct 1 credit from the generating user ──
  const userDoc = await getDoc(`users/${user.uid}`)
  await updateDoc(`users/${user.uid}`, { credits: (userDoc?.credits ?? user.credits) - COST })

  res.json({ explanation, cached: false, creditsRemaining: (userDoc?.credits ?? user.credits) - COST })
}
