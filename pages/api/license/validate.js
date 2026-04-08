import { getDoc, updateDoc } from '../../../lib/firestore'

/**
 * POST /api/license/validate
 * Body: { licenseKey, machineId }
 *
 * Returns: { valid: bool, message: string }
 *
 * Called by the Vedion Screen Share Windows app to validate license on startup.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { licenseKey, machineId } = req.body ?? {}

  if (!licenseKey) return res.status(400).json({ valid: false, message: 'No license key provided.' })

  try {
    const license = await getDoc(`licenses/${licenseKey}`)

    if (!license) {
      return res.json({ valid: false, message: 'License key not found.' })
    }

    if (license.product !== 'screen_share') {
      return res.json({ valid: false, message: 'Invalid license type.' })
    }

    // If already activated on a different machine, reject
    if (license.activated && license.machineId && machineId && license.machineId !== machineId) {
      return res.json({ valid: false, message: 'License already activated on another machine. Contact support to transfer.' })
    }

    // Activate on this machine if not yet activated
    if (!license.activated || !license.machineId) {
      await updateDoc(`licenses/${licenseKey}`, {
        activated: true,
        machineId: machineId ?? null,
        activatedAt: new Date().toISOString(),
      })
    }

    return res.json({
      valid: true,
      message: 'License valid.',
      email: license.email,
    })

  } catch (e) {
    console.error('[license/validate]', e)
    return res.status(500).json({ valid: false, message: 'Validation error. Try again.' })
  }
}
