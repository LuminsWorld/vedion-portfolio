import { requireAuth } from '../../../lib/authMiddleware'
import { getDoc, updateDoc } from '../../../lib/firestore'
import { PLAN_LIMITS } from '../../../lib/credits'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { user, error, status } = await requireAuth(req)
    if (error) return res.status(status).json({ error })

    const { code } = req.body ?? {}
    if (!code?.trim()) return res.status(400).json({ error: 'No code provided.' })

    const normalized = code.trim().toUpperCase()
    const codeDoc = await getDoc(`inviteCodes/${normalized}`)
    if (!codeDoc)       return res.status(400).json({ error: 'Invalid code.' })
    if (codeDoc.used)   return res.status(400).json({ error: 'Code already used.' })

    const plan      = codeDoc.plan ?? 'free'
    const duration  = codeDoc.duration ?? 'indefinite'   // days or 'indefinite'
    const planLimits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
    const credits   = planLimits.credits

    const accessExpiresAt = duration === 'indefinite'
      ? null
      : new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toISOString()

    // Mark code as used
    await updateDoc(`inviteCodes/${normalized}`, {
      used: true,
      usedBy: user.uid,
      usedAt: new Date().toISOString(),
    })

    // Grant access + plan + credits
    await updateDoc(`users/${user.uid}`, {
      accessGranted: true,
      plan,
      credits,
      accessExpiresAt,
    })

    res.json({ ok: true, plan, credits, accessExpiresAt })
  } catch (e) {
    console.error('[access/redeem]', e)
    res.status(500).json({ error: e.message })
  }
}
