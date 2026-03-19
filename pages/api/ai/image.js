import { GoogleGenAI } from '@google/genai'
import { v2 as cloudinary } from 'cloudinary'
import { requireAuth } from '../../../lib/authMiddleware'
import { adminDb, admin } from '../../../lib/firebaseAdmin'
import { getCreditCost, canUseModel, IMAGE_MODELS } from '../../../lib/credits'

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
})

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
    // Generate image
    const response = await genai.models.generateImages({
      model,
      prompt,
      config: { numberOfImages: 1, aspectRatio },
    })

    const imageBytes = response.generatedImages[0].image.imageBytes
    const base64     = Buffer.from(imageBytes).toString('base64')
    const dataUri    = `data:image/png;base64,${base64}`

    // Upload to Cloudinary
    const upload = await cloudinary.uploader.upload(dataUri, {
      folder: `vedion/${user.uid}`,
      resource_type: 'image',
    })

    const imageUrl = upload.secure_url

    // Deduct credits
    await adminDb.collection('users').doc(user.uid).update({
      credits: admin.firestore.FieldValue.increment(-cost),
    })

    // Save messages
    const now    = admin.firestore.FieldValue.serverTimestamp()
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
