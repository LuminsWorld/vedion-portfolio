import { requireAuth } from '../../../lib/authMiddleware'
import { listDocs, setDoc, countDocs, serverTimestamp, generateId } from '../../../lib/firestore'
import { PLAN_LIMITS } from '../../../lib/credits'

export default async function handler(req, res) {
  try {
    const { user, error, status } = await requireAuth(req, { requireAccess: true })
    if (error) return res.status(status).json({ error })

    if (req.method === 'GET') {
      const chats = await listDocs(`users/${user.uid}/chats`, { orderBy: 'updatedAt', desc: true, limit: 100 })
      return res.json({ chats })
    }

    if (req.method === 'POST') {
      const { title = 'New Chat', projectId = null } = req.body ?? {}
      const limit = PLAN_LIMITS[user.plan]?.chats

      if (limit !== null && limit !== undefined) {
        const count = await countDocs(`users/${user.uid}/chats`)
        if (count >= limit) {
          return res.status(403).json({
            error: `Free plan is limited to ${limit} chats. Upgrade to Pro for unlimited.`,
            upgradeRequired: true,
          })
        }
      }

      const chatId = generateId()
      const now = serverTimestamp()
      await setDoc(`users/${user.uid}/chats/${chatId}`, { id: chatId, title, projectId, createdAt: now, updatedAt: now })
      return res.json({ chatId, title })
    }

    res.status(405).end()
  } catch (e) {
    console.error('[/api/chats]', e)
    res.status(500).json({ error: e.message })
  }
}
