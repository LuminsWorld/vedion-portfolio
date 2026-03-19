import { requireAuth } from '../../lib/authMiddleware'

export default async function handler(req, res) {
  try {
    const { user, error } = await requireAuth(req)
    if (error) return res.json({ firebase: 'auth_failed', error })
    res.json({ firebase: 'ok', uid: user.uid, plan: user.plan, credits: user.credits })
  } catch (e) {
    res.status(500).json({ firebase: 'error', message: e.message })
  }
}
