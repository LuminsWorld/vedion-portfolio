import { GoogleGenAI } from '@google/genai'
import { v4 as uuidv4 } from 'uuid'
const { requireAuth } = require('../../../lib/authMiddleware')
const { adminDb, FieldValue, adminStorage } = require('../../../lib/firebaseAdmin')
import { getCreditCost, canUseModel, IMAGE_MODELS } from '../../../lib/credits'

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { user, error, status } = await requireAuth(req)
  if (error) return res.status(status).json({ error })

  const { chatId, prompt, model = 'imagen-4.0-generate-001', aspectRatio = '1:1' } = req.body
  if (!chatId || !prompt) return res.status(400).json({ error: 'Missing chatId or prompt' })
  if (!IMAGE_MODELS.has(model)) return res.status(400).json({ error: 'Invalid image model' })

  if (!canUseModel(user.plan, model)) {
    return res.status(403).json({ error: `${model} requires a higher plan.`, upgradeRequired: true })
  }

  const cost = getCreditCost(model)
  if (user.credits < cost) {
    return res.status(402).json({ error: 'Not enough credits.', creditsNeeded: cost, creditsAvailable: user.credits })
  }

  try {
    // Generate image via Imagen
    const response = await genai.models.generateImages({
      model,
      prompt,
      config: { numberOfImages: 1, aspectRatio },
    })

    const imageBytes = response.generatedImages[0].image.imageBytes
    const buffer     = Buffer.from(imageBytes)

    // Upload to Firebase Storage
    const bucket   = adminStorage.bucket()
    const filename = `images/${user.uid}/${uuidv4()}.png`
    const file     = bucket.file(filename)

    await file.save(buffer, { contentType: 'image/png', public: true })

    const imageUrl = `https://storage.googleapis.com/vedion-978cc.firebasestorage.app/${filename}`

    // Deduct credits
    await adminDb.collection('users').doc(user.uid).update({
      credits: FieldValue.increment(-cost),
    })

    // Save messages
    const now    = FieldValue.serverTimestamp()
    const msgRef = adminDb.collection('users').doc(user.uid)
      .collection('chats').doc(chatId).collection('messages')

    await msgRef.add({ role: 'user',      content: prompt,   type: 'text',  createdAt: now })
    await msgRef.add({ role: 'assistant', content: imageUrl, type: 'image', model, createdAt: now })

    await adminDb.collection('users').doc(user.uid)
      .collection('chats').doc(chatId)
      .set({ updatedAt: now }, { merge: true })

    res.json({ imageUrl, creditsUsed: cost, creditsRemaining: user.credits - cost })

  } catch (e) {
    console.error('Image gen error:', e)
    res.status(500).json({ error: 'Image generation failed.' })
  }
}
