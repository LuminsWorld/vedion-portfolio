import { requireAuth } from '../../../lib/authMiddleware'
import { getDoc, setDoc } from '../../../lib/firestore'

export default async function handler(req, res) {
  // Auth optional — guests use localStorage, logged-in users use Firestore
  const { user } = await requireAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthenticated' })

  const { courseId } = req.query

  if (req.method === 'GET') {
    const doc = await getDoc(`users/${user.uid}/courseProgress/${courseId}`)
    return res.json(doc ?? { completedModules: [], quizScores: {}, lastModule: null })
  }

  if (req.method === 'POST') {
    const { completedModules, quizScores, lastModule } = req.body ?? {}
    await setDoc(`users/${user.uid}/courseProgress/${courseId}`, {
      completedModules: completedModules ?? [],
      quizScores:       quizScores ?? {},
      lastModule:       lastModule ?? null,
      updatedAt:        new Date().toISOString(),
    })
    return res.json({ ok: true })
  }

  res.status(405).end()
}
