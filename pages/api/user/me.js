import { requireAuth } from '../../../lib/authMiddleware'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { user, error, status } = await requireAuth(req, { requireAccess: true })
  if (error) return res.status(status).json({ error })
  res.json({ uid: user.uid, email: user.email, plan: user.plan, credits: user.credits, billingCycleEnd: user.billingCycleEnd ?? null })
}
