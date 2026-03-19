const { requireAuth } = require('../../../lib/authMiddleware')
const { adminDb, FieldValue } = require('../../../lib/firebaseAdmin')
import { PLAN_LIMITS } from '../../../lib/credits'

export default async function handler(req, res) {
  const { user, error, status } = await requireAuth(req)
  if (error) return res.status(status).json({ error })

  if (req.method === 'GET') {
    const snap = await adminDb.collection('users').doc(user.uid)
      .collection('chats').orderBy('updatedAt', 'desc').limit(100).get()
    return res.json({ chats: snap.docs.map(d => ({ id: d.id, ...d.data() })) })
  }

  if (req.method === 'POST') {
    const { title = 'New Chat', projectId = null } = req.body
    const limit = PLAN_LIMITS[user.plan]?.chats

    if (limit !== null && limit !== undefined) {
      const count = await adminDb.collection('users').doc(user.uid)
        .collection('chats').count().get()
      if (count.data().count >= limit) {
        return res.status(403).json({
          error: `Free plan is limited to ${limit} chats. Upgrade to Pro for unlimited.`,
          upgradeRequired: true,
        })
      }
    }

    const ref = adminDb.collection('users').doc(user.uid).collection('chats').doc()
    const now = FieldValue.serverTimestamp()
    await ref.set({ id: ref.id, title, projectId, createdAt: now, updatedAt: now })
    return res.json({ chatId: ref.id, title })
  }

  res.status(405).end()
}
