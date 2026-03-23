import { GoogleGenAI } from '@google/genai'
import { requireAuth } from '../../../lib/authMiddleware'
import { getDoc, updateDoc, setDoc, serverTimestamp, generateId } from '../../../lib/firestore'
import { getServiceAccountToken } from '../../../lib/googleAuth'
import { getCreditCost, canUseModel, IMAGE_MODELS } from '../../../lib/credits'

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const STORAGE_BUCKET = 'vedion-978cc.firebasestorage.app'

async function uploadImageToStorage(imageBytes, userId) {
  const timestamp = Date.now()
  const path = `images/${userId}/${timestamp}.png`
  const encodedPath = encodeURIComponent(path)
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o?uploadType=media&name=${encodedPath}`

  const token = await getServiceAccountToken()
  const imageBuffer = Buffer.from(imageBytes, 'base64')

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'image/png',
    },
    body: imageBuffer,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Firebase Storage upload failed (${res.status}): ${text}`)
  }

  // Public download URL (no token required — bucket rules control access)
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { user, error, status } = await requireAuth(req, { requireAccess: true })
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
    const m1 = generateId(), m2 = generateId()
    await setDoc(`users/${user.uid}/chats/${chatId}/messages/${m1}`, { role: 'user',      content: prompt,   type: 'text',  createdAt: now })
    await setDoc(`users/${user.uid}/chats/${chatId}/messages/${m2}`, { role: 'assistant', content: imageUrl, type: 'image', model, createdAt: now })
    await updateDoc(`users/${user.uid}/chats/${chatId}`, { updatedAt: now })

    res.json({ imageUrl, creditsUsed: cost, creditsRemaining: (userDoc?.credits ?? user.credits) - cost })

  } catch (e) {
    console.error('Image gen error:', e)
    res.status(500).json({ error: e.message })
  }
}
