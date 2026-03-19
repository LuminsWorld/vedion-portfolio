import { requireAuth } from '../../../lib/authMiddleware'
import { adminDb } from '../../../lib/firebaseAdmin'

export default async function handler(req, res) {
  const { user, error, status } = await requireAuth(req)
  if (error) return res.status(status).json({ error })

  const { chatId } = req.query

  if (req.method === 'GET') {
    const snap = await adminDb.collection('users').doc(user.uid)
      .collection('chats').doc(chatId)
      .collection('messages').orderBy('createdAt', 'asc').get()
    return res.json({ messages: snap.docs.map(d => ({ id: d.id, ...d.data() })) })
  }

  if (req.method === 'PATCH') {
    const { title } = req.body
    await adminDb.collection('users').doc(user.uid)
      .collection('chats').doc(chatId).update({ title })
    return res.json({ success: true })
  }

  if (req.method === 'DELETE') {
    const msgSnap = await adminDb.collection('users').doc(user.uid)
      .collection('chats').doc(chatId).collection('messages').get()
    const batch = adminDb.batch()
    msgSnap.docs.forEach(d => batch.delete(d.ref))
    batch.delete(adminDb.collection('users').doc(user.uid).collection('chats').doc(chatId))
    await batch.commit()
    return res.json({ success: true })
  }

  res.status(405).end()
}
