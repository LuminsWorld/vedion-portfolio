import { requireAuth } from '../../../lib/authMiddleware'
import { getDoc, setDoc } from '../../../lib/firestore'

export default async function handler(req, res) {
  const { user } = await requireAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthenticated' })

  const { courseId, examId } = req.query
  if (!courseId || !examId) return res.status(400).json({ error: 'courseId and examId required' })

  // Validate it's actually an exam module (security check)
  if (!examId.startsWith('exam-')) return res.status(400).json({ error: 'examId must be an exam checkpoint' })

  const docId = `${user.uid}_${courseId}_${examId}`
  const path = `flashcardProgress/${docId}`

  if (req.method === 'GET') {
    try {
      const doc = await getDoc(path)
      if (!doc) return res.json({ progress: null })
      return res.json({ progress: doc })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to load progress' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { progress } = req.body ?? {}
      if (!progress) return res.status(400).json({ error: 'progress required' })

      const toSave = {
        ...progress,
        uid: user.uid,
        courseId,
        examId,
        updatedAt: new Date().toISOString(),
      }

      await setDoc(path, toSave)
      return res.json({ ok: true })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to save progress' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
