import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI } from '@google/genai'
import { requireAuth } from '../../../lib/authMiddleware'
import { setDoc, updateDoc, getDoc, serverTimestamp, generateId } from '../../../lib/firestore'
import { getCreditCost, canUseModel, IMAGE_MODELS, PLAN_LIMITS } from '../../../lib/credits'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const genai     = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const CLAUDE_MODELS = new Set(['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-6'])
const GEMINI_MODELS = new Set(['gemini-2.5-flash', 'gemini-2.5-pro'])

const MODEL_IDS = {
  'claude-haiku-4-5':  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6': 'claude-sonnet-4-6',
  'claude-opus-4-6':   'claude-opus-4-6',
}

const ALLOWED_MIME = new Set([
  'image/jpeg','image/png','image/gif','image/webp',
  'application/pdf',
  'text/plain','text/markdown','text/csv','text/javascript','text/typescript',
  'text/html','text/css','application/json','application/xml',
])

const IMAGE_MIME = new Set(['image/jpeg','image/png','image/gif','image/webp'])

// Fetch a file from Firebase Storage download URL and return { base64, text }
async function fetchFileContent(url, mimeType) {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Failed to fetch file: ${resp.status}`)
  const buf = await resp.arrayBuffer()

  if (IMAGE_MIME.has(mimeType)) {
    const base64 = Buffer.from(buf).toString('base64')
    return { type: 'image', base64, mimeType }
  }

  // PDF — pass as base64 to Claude (it supports PDF natively)
  if (mimeType === 'application/pdf') {
    const base64 = Buffer.from(buf).toString('base64')
    return { type: 'pdf', base64, mimeType }
  }

  // Text/code — decode as UTF-8
  const text = new TextDecoder('utf-8').decode(buf)
  return { type: 'text', text }
}

// Build Claude content blocks for a user turn with files
async function buildClaudeContent(message, files) {
  if (!files?.length) return message

  const blocks = []

  for (const f of files) {
    const content = await fetchFileContent(f.url, f.mimeType)
    if (content.type === 'image') {
      blocks.push({ type: 'image', source: { type: 'base64', media_type: content.mimeType, data: content.base64 } })
    } else if (content.type === 'pdf') {
      blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: content.base64 } })
    } else {
      blocks.push({ type: 'text', text: `<file name="${f.name}">\n${content.text}\n</file>` })
    }
  }

  blocks.push({ type: 'text', text: message })
  return blocks
}

// Build Gemini parts for a user turn with files
async function buildGeminiParts(message, files) {
  if (!files?.length) return [{ text: message }]

  const parts = []

  for (const f of files) {
    const content = await fetchFileContent(f.url, f.mimeType)
    if (content.type === 'image') {
      parts.push({ inlineData: { mimeType: content.mimeType, data: content.base64 } })
    } else if (content.type === 'pdf') {
      parts.push({ inlineData: { mimeType: 'application/pdf', data: content.base64 } })
    } else {
      parts.push({ text: `<file name="${f.name}">\n${content.text}\n</file>` })
    }
  }

  parts.push({ text: message })
  return parts
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { user, error, status } = await requireAuth(req, { requireAccess: true })
    if (error) return res.status(status).json({ error })

    // Accept 'content' (new streaming frontend) or 'message' (legacy)
    const { chatId, content, message: legacyMessage, model = 'claude-haiku-4-5', history = [], files = [] } = req.body ?? {}
    const userMessage = content ?? legacyMessage
    if (!chatId || !userMessage) return res.status(400).json({ error: 'Missing chatId or message' })
    if (IMAGE_MODELS.has(model)) return res.status(400).json({ error: 'Use /api/ai/image for image generation' })

    if (!canUseModel(user.plan, model)) {
      return res.status(403).json({ error: `${model} requires a higher plan.`, upgradeRequired: true })
    }

    // ── Strict file validation (server-side, cannot be bypassed) ─────────
    const limits = PLAN_LIMITS[user.plan] ?? PLAN_LIMITS.free
    if (files.length > limits.files) {
      return res.status(400).json({ error: `Max ${limits.files} file${limits.files > 1 ? 's' : ''} per message on ${user.plan} plan.` })
    }
    for (const f of files) {
      if (!ALLOWED_MIME.has(f.mimeType)) {
        return res.status(400).json({ error: `File type not allowed: ${f.mimeType}` })
      }
      if (f.size > limits.fileSize) {
        const mb = Math.round(limits.fileSize / 1024 / 1024)
        return res.status(400).json({ error: `File "${f.name}" exceeds ${mb}MB limit on ${user.plan} plan.` })
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    const cost = getCreditCost(model)
    if (user.credits < cost) {
      return res.status(402).json({ error: 'Not enough credits.', creditsNeeded: cost, creditsAvailable: user.credits })
    }

    // ── Start streaming ───────────────────────────────────────────────────
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Accel-Buffering': 'no',
      'Cache-Control': 'no-cache',
    })

    let fullReply = ''

    if (CLAUDE_MODELS.has(model)) {
      const userContent = await buildClaudeContent(userMessage, files)
      const messages = [
        ...history.slice(-20).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userContent },
      ]
      const stream = anthropic.messages.stream({
        model: MODEL_IDS[model] ?? model,
        max_tokens: 4096,
        system: 'You are Vedion, a sharp and direct AI assistant.',
        messages,
      })
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text
          fullReply += text
          res.write(text)
        }
      }

    } else if (GEMINI_MODELS.has(model)) {
      const userParts = await buildGeminiParts(userMessage, files)
      const contents = [
        ...history.slice(-20).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        { role: 'user', parts: userParts },
      ]
      const result = await genai.models.generateContentStream({
        model,
        contents,
        config: { systemInstruction: 'You are Vedion, a sharp and direct AI assistant.' },
      })
      for await (const chunk of result) {
        const text = chunk.text
        if (text) {
          fullReply += text
          res.write(text)
        }
      }

    } else {
      res.end()
      return
    }

    res.end()

    // ── Post-stream: deduct credits + save to Firestore ───────────────────
    try {
      const now = serverTimestamp()
      const userDoc = await getDoc(`users/${user.uid}`)
      await updateDoc(`users/${user.uid}`, { credits: (userDoc?.credits ?? user.credits) - cost })

      const m1 = generateId(), m2 = generateId()
      await setDoc(`users/${user.uid}/chats/${chatId}/messages/${m1}`, {
        role: 'user', content: userMessage, files: files.length ? files.map(f => ({ name: f.name, url: f.url, mimeType: f.mimeType, size: f.size })) : null, model, createdAt: now,
      })
      await setDoc(`users/${user.uid}/chats/${chatId}/messages/${m2}`, {
        role: 'assistant', content: fullReply, model, createdAt: now,
      })
      await updateDoc(`users/${user.uid}/chats/${chatId}`, { updatedAt: now })
    } catch (saveErr) {
      console.error('Post-stream save error:', saveErr)
    }

  } catch (e) {
    console.error('Chat error:', e)
    if (!res.headersSent) {
      res.status(500).json({ error: e.message })
    } else {
      res.end()
    }
  }
}
