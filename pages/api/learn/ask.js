import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '../../../lib/authMiddleware'
import { getDoc, updateDoc } from '../../../lib/firestore'
import { getModule } from '../../../lib/courseData'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { user, error, status } = await requireAuth(req, { requireAccess: true })
  if (error) return res.status(status).json({ error })

  if (!['pro', 'ultra'].includes(user.plan)) {
    return res.status(403).json({ error: 'AI chat requires a Pro or Ultra plan.', upgradeRequired: true })
  }

  const COST = 2
  if (user.credits < COST) {
    return res.status(402).json({ error: 'Not enough credits. You need at least 2.' })
  }

  const { courseId, moduleId, selectedText, question } = req.body ?? {}
  if (!selectedText || !question) {
    return res.status(400).json({ error: 'Missing selectedText or question.' })
  }

  // Build module context — content is stored as markdown string
  const mod = getModule(courseId, moduleId)
  const contextBlock = mod
    ? `Module: "${mod.title}"\n\n${String(mod.content ?? '').slice(0, 2500)}`
    : ''

  const prompt = `You are a precise study assistant helping a student understand course material.

${contextBlock}

The student selected this passage from the module:
"""
${selectedText.slice(0, 800)}
"""

Their question: ${question}

Answer directly and concisely (3-5 sentences). Reference the selected text where relevant. Use plain text only — no markdown headers.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const answer = response.content[0].text
    const userDoc = await getDoc(`users/${user.uid}`)
    const newCredits = (userDoc?.credits ?? user.credits) - COST
    await updateDoc(`users/${user.uid}`, { credits: newCredits })

    return res.json({ answer, creditsRemaining: newCredits })
  } catch (e) {
    console.error('ask.js AI error:', e)
    return res.status(500).json({ error: 'AI request failed: ' + e.message })
  }
}
