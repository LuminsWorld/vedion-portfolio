import { requireAuth } from '../../../lib/authMiddleware'
import { listDocs, updateDoc, deleteDoc, serverTimestamp } from '../../../lib/firestore'

export default async function handler(req, res) {
  try {
    const { user, error, status } = await requireAuth(req)
    if (error) return res.status(status).json({ error })

    const { chatId } = req.query

    if (req.method === 'GET') {
      const messages = await listDocs(`users/${user.uid}/chats/${chatId}/messages`, { orderBy: 'createdAt' })
      return res.json({ messages })
    }

    if (req.method === 'PATCH') {
      const { title, icon, color } = req.body ?? {}
      const patch = { updatedAt: serverTimestamp() }
      if (title !== undefined) patch.title = title
      if (icon  !== undefined) patch.icon  = icon
      if (color !== undefined) patch.color = color
      await updateDoc(`users/${user.uid}/chats/${chatId}`, patch)
      return res.json({ success: true })
    }

    if (req.method === 'DELETE') {
      // Delete all messages first, then the chat
      const messages = await listDocs(`users/${user.uid}/chats/${chatId}/messages`, { limit: 500 })
      await Promise.all(messages.map(m => deleteDoc(`users/${user.uid}/chats/${chatId}/messages/${m.id}`)))
      await deleteDoc(`users/${user.uid}/chats/${chatId}`)
      return res.json({ success: true })
    }

    res.status(405).end()
  } catch (e) {
    console.error('[/api/chats/[chatId]]', e)
    res.status(500).json({ error: e.message })
  }
}
