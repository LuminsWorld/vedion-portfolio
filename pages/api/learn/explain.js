import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '../../../lib/authMiddleware'
import { getDoc, updateDoc } from '../../../lib/firestore'
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

  const COST = 1
  if (user.credits < COST) {
    return res.status(402).json({ error: 'Not enough credits.' })
  }

  const { courseId, moduleId, question, wrongAnswer, correctAnswer } = req.body ?? {}
  if (!courseId || !moduleId || !question) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  const mod = getModule(courseId, moduleId)
  const context = mod ? `Module: "${mod.title}"\n\nContent:\n${mod.content}` : ''

  const prompt = `A student got this quiz question wrong. Explain it clearly and concisely.

${context}

Question: ${question}
Their answer: ${wrongAnswer ?? 'Unknown'}
Correct answer: ${correctAnswer}

Give a short, clear explanation (2-4 sentences) of why the correct answer is right and what concept to understand.`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const explanation = response.content[0].text

  // Deduct 1 credit
  const userDoc = await getDoc(`users/${user.uid}`)
  await updateDoc(`users/${user.uid}`, { credits: (userDoc?.credits ?? user.credits) - COST })

  res.json({ explanation, creditsRemaining: (userDoc?.credits ?? user.credits) - COST })
}
