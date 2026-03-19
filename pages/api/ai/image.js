import { GoogleGenAI } from '@google/genai'
import { requireAuth } from '../../../lib/authMiddleware'
import { getDoc, updateDoc, addDoc, serverTimestamp, generateId } from '../../../lib/firestore'
import { getCreditCost, canUseModel, IMAGE_MODELS } from '../../../lib/credits'

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { user, error, status } = await requireAuth(req)
    if (error) return res.status(status).json({ error })

    const { chatId, prompt, model = 'imagen-4.0-generate-001', aspectRatio = '1:1' } = req.body ?? {}
    if (!chatId || !prompt) return res.status(400).json({ error: 'Missing chatId or prompt' })
    if (!IMAGE_MODELS.has(model)) return res.status(400).json({ error: 'Invalid image model' })

    if (!canUseModel(user.plan, model)) {
      return res.status(403).json({ error: `${model} requires a higher plan.`, upgradeRequired: true })
    }

    const cost = getCreditCost(model)
    if (user.credits < cost) {
      return res.status(402).json({ error: 'Not enough credits.', creditsNeeded: cost })
    }

    // Generate image via Imagen
    const response = await genai.models.generateImages({
      model,
      prompt,
      config: { numberOfImages: 1, aspectRatio },
    })

    const imageBytes = response.generatedImages[0].image.imageBytes
    // Return as base64 data URL (no storage needed)
    const imageUrl = `data:image/png;base64,${imageBytes}`

    const now = serverTimestamp()
    const userDoc = await getDoc(`users/${user.uid}`)

    // Deduct credits
    await updateDoc(`users/${user.uid}`, { credits: (userDoc?.credits ?? user.credits) - cost })

    // Save messages
    await addDoc(`users/${user.uid}/chats/${chatId}/messages`, { role: 'user',      content: prompt,   type: 'text',  createdAt: now })
    await addDoc(`users/${user.uid}/chats/${chatId}/messages`, { role: 'assistant', content: imageUrl, type: 'image', model, createdAt: now })
    await updateDoc(`users/${user.uid}/chats/${chatId}`, { updatedAt: now })

    res.json({ imageUrl, creditsUsed: cost, creditsRemaining: (userDoc?.credits ?? user.credits) - cost })

  } catch (e) {
    console.error('Image gen error:', e)
    res.status(500).json({ error: e.message })
  }
}
