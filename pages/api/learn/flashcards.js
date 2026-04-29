import { requireAuth } from '../../../lib/authMiddleware'
import { getDoc, setDoc } from '../../../lib/firestore'

export default async function handler(req, res) {
  const { user } = await requireAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthenticated' })

  const { courseId, moduleId, examId } = req.query
  const mid = moduleId ?? examId   // accept both param names for backward compat
  if (!courseId || !mid) return res.status(400).json({ error: 'courseId and moduleId required' })

  const docId = `${user.uid}_${courseId}_${mid}`
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
        moduleId: mid,
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
