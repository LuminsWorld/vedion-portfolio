// Auth middleware — jose JWT verification, no firebase-admin
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { getDoc, setDoc, updateDoc, serverTimestamp } from './firestore'
import { PLAN_LIMITS } from './credits'

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

// Comma-separated owner emails: OWNER_EMAILS=a@b.com,c@d.com
const OWNER_EMAILS = new Set(
  (process.env.OWNER_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
)

export async function requireAuth(req, { requireAccess = false } = {}) {
  const authHeader = req.headers.authorization ?? ''
  if (!authHeader.startsWith('Bearer ')) return { error: 'Unauthorized', status: 401 }

  const token = authHeader.slice(7)
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      audience: 'vedion-978cc',
      issuer: 'https://securetoken.google.com/vedion-978cc',
    })

    const uid   = payload.sub
    const email = (payload.email ?? '').toLowerCase()
    const isOwner = OWNER_EMAILS.has(email)
    const existing = await getDoc(`users/${uid}`)

    let user
    if (!existing) {
      user = {
        uid, email,
        plan: isOwner ? 'ultra' : 'free',
        credits: isOwner ? 99999 : 20,
        accessGranted: isOwner,
        accessExpiresAt: null,
        createdAt: serverTimestamp(),
        billingCycleEnd: null,
      }
      await setDoc(`users/${uid}`, user)
    } else {
      user = { ...existing }

      // Auto-grant owner accounts that somehow aren't granted yet
      if (isOwner && (!user.accessGranted || user.plan !== 'ultra')) {
        await updateDoc(`users/${uid}`, { accessGranted: true, plan: 'ultra', credits: 99999 })
        user.accessGranted = true
        user.plan = 'ultra'
        user.credits = 99999
      }
    }

    // Check access expiry
    if (user.accessGranted && user.accessExpiresAt) {
      if (new Date(user.accessExpiresAt) < new Date()) {
        await updateDoc(`users/${uid}`, { accessGranted: false, plan: 'free' })
        user.accessGranted = false
        user.plan = 'free'
      }
    }

    if (requireAccess && user.accessGranted !== true) {
      return { error: 'Access not granted. Enter an invite code or upgrade.', status: 403, needsAccess: true }
    }

    return { user }
  } catch (e) {
    return { error: `Auth error: ${e.message}`, status: 401 }
  }
}
