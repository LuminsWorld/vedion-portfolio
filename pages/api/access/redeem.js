import { requireAuth } from '../../../lib/authMiddleware'
import { getDoc, setDoc, updateDoc } from '../../../lib/firestore'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { user, error, status } = await requireAuth(req)
    if (error) return res.status(status).json({ error })

    const { code } = req.body ?? {}
    if (!code?.trim()) return res.status(400).json({ error: 'No code provided.' })

    const normalized = code.trim().toUpperCase()

    // Check code exists and is unused
    const codeDoc = await getDoc(`inviteCodes/${normalized}`)
    if (!codeDoc) return res.status(400).json({ error: 'Invalid code.' })
    if (codeDoc.used) return res.status(400).json({ error: 'Code already used.' })

    // Mark code as used
    await updateDoc(`inviteCodes/${normalized}`, {
      used: true,
      usedBy: user.uid,
      usedAt: new Date().toISOString(),
    })

    // Grant access to user
    await updateDoc(`users/${user.uid}`, { accessGranted: true })

    res.json({ ok: true })
  } catch (e) {
    console.error('[access/redeem]', e)
    res.status(500).json({ error: e.message })
  }
}
