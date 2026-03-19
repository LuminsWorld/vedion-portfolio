import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI } from '@google/genai'
import { requireAuth } from '../../../lib/authMiddleware'
import { addDoc, updateDoc, getDoc, serverTimestamp } from '../../../lib/firestore'
import { getCreditCost, canUseModel, IMAGE_MODELS } from '../../../lib/credits'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const genai     = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const CLAUDE_MODELS = new Set(['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-6'])
const GEMINI_MODELS = new Set(['gemini-2.5-flash', 'gemini-2.5-pro'])

const MODEL_IDS = {
  'claude-haiku-4-5':  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6': 'claude-sonnet-4-6',
  'claude-opus-4-6':   'claude-opus-4-6',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { user, error, status } = await requireAuth(req)
    if (error) return res.status(status).json({ error })

    const { chatId, message, model = 'claude-haiku-4-5', history = [] } = req.body ?? {}
    if (!chatId || !message) return res.status(400).json({ error: 'Missing chatId or message' })
    if (IMAGE_MODELS.has(model)) return res.status(400).json({ error: 'Use /api/ai/image for image generation' })

    if (!canUseModel(user.plan, model)) {
      return res.status(403).json({ error: `${model} requires a higher plan.`, upgradeRequired: true })
    }

    const cost = getCreditCost(model)
    if (user.credits < cost) {
      return res.status(402).json({ error: 'Not enough credits.', creditsNeeded: cost, creditsAvailable: user.credits })
    }

    const messages = [
      ...history.slice(-20).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ]

    let reply

    if (CLAUDE_MODELS.has(model)) {
      const response = await anthropic.messages.create({
        model: MODEL_IDS[model] ?? model,
        max_tokens: 4096,
        system: 'You are Vedion, a sharp and direct AI assistant.',
        messages,
      })
      reply = response.content[0].text

    } else if (GEMINI_MODELS.has(model)) {
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
      const response = await genai.models.generateContent({
        model,
        contents,
        config: { systemInstruction: 'You are Vedion, a sharp and direct AI assistant.' },
      })
      reply = response.text

    } else {
      return res.status(400).json({ error: 'Unknown model' })
    }

    const now = serverTimestamp()

    // Deduct credits
    const userDoc = await getDoc(`users/${user.uid}`)
    await updateDoc(`users/${user.uid}`, { credits: (userDoc?.credits ?? user.credits) - cost })

    // Save messages
    await addDoc(`users/${user.uid}/chats/${chatId}/messages`, { role: 'user',      content: message, model, createdAt: now })
    await addDoc(`users/${user.uid}/chats/${chatId}/messages`, { role: 'assistant', content: reply,   model, createdAt: now })
    await updateDoc(`users/${user.uid}/chats/${chatId}`, { updatedAt: now })

    res.json({ reply, creditsUsed: cost, creditsRemaining: (userDoc?.credits ?? user.credits) - cost })

  } catch (e) {
    console.error('Chat error:', e)
    res.status(500).json({ error: e.message })
  }
}
